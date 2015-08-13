'use strict';

var through2 = require('through2');
var gutil = require('gulp-util');
var yaml = require('js-yaml');

// This method transforms string scalar values in a RAML (YAML) file
// to use the "|" style markup instead of the ">" style markup since
// the RAML Parser doesn't use the js YAML parser and doesn't support
// that style of string scalar.
function fixupRaml(raml) {
  var inFoldSection = false,
    badEndRe = /: *>(-|\++)?$/,
    sectionIndent = -1,
    lineIndent = 0,
    lastLine = '',
    result = raml.split('\n').reduce(function (pv, cv) {
      var cols;
      if (!inFoldSection && cv.match(badEndRe)) {
        cv = cv.replace(badEndRe, ': |');
        inFoldSection = true;
      } else if (inFoldSection) {
        cols = cv.match(/^( *)/);
        lineIndent = cols[1].length;
        if (sectionIndent < 0) {
          sectionIndent = lineIndent;
          lastLine = cv;
          return pv;
        } else if (cv === '') {
          // Skip blank lines
          cv = lastLine;
          lastLine = '';
          if (cv === '') {
            return pv;
          }
        } else if (sectionIndent - lineIndent >= 2) {
          sectionIndent = -1;
          inFoldSection = false;
          pv = pv.concat(lastLine);
        } else {
          if (lastLine !== '') {
            lastLine = lastLine + ' ' + cv.match(/^ *(.*)$/)[1];
            // lastLine = '';
          } else {
            lastLine = cv;
          }
          return pv;
        }
      }
      return pv.concat(cv);
    }, []).join('\n');
  return result;
}

function fixRamlOutput() {
  var stream = through2.obj(function (file, enc, done) {
    var ramlObj,
      fail = function (message) {
        done(new gutil.PluginError('deref-raml-schema', message));
      };

    if (file.isBuffer()) {
      ramlObj = JSON.parse(file.contents.toString(enc));
      ramlObj = fixupRaml('#%RAML 0.8\n---\n' + yaml.dump(ramlObj));
      stream.push(new gutil.File({
        base: file.base,
        cwd: file.cwd,
        path: file.path,
        contents: new Buffer(ramlObj)
      }));
      done();
    } else if (file.isStream()) {
      fail('Streams are not supported: ' + file.inspect());
    } else if (file.isNull()) {
      fail('Input file is null: ' + file.inspect());
    }
  });

  return stream;
}

module.exports = fixRamlOutput;