'use strict';
var through2 = require('through2');
var gutil = require('gulp-util');
var path = require('path');

// Taken from this gist: https://gist.github.com/iki/784ddd5ab33c1e1b726b
function gulpRaml2Html(options) {
  var raml2html = require('raml2html');

  var simplifyMark = function (mark) {
    if (mark) {
      mark.buffer = mark.buffer.split('\n', mark.line + 1)[mark.line].trim();
    }
  };

  if (!options) {
    options = {};
  }
  switch (options.type) {
  case 'json':
    options.config = {
      template: function (obj) {
        return JSON.stringify(obj, null, 2);
      }
    };
    break;
  case 'yaml':
    var yaml = require('js-yaml');
    options.config = {
      template: function (obj) {
        return yaml.safeDump(obj, {
          skipInvalid: true
        });
      }
    };
    break;
  default:
    options.type = 'html';
    if (!options.config) {
      options.config = raml2html.getDefaultConfig(options.mainTemplate, options.templatesPath);
    }
  }
  if (!options.extension) {
    options.extension = '.' + options.type;
  }

  var stream = through2.obj(function (file, enc, done) {
    var fail = function (message) {
      return done(new gutil.PluginError('raml2html', message));
    };

    if (file.isStream()) {
      return fail('Streams are not supported: ' + file.inspect());
    } else if (file.isNull()) {
      return fail('Input file is null: ' + file.inspect());
    } else if (!file.isBuffer()) {
      return fail('Expected a buffer: ' + file.inspect());
    }

    var cwd = process.cwd();
    process.chdir(path.resolve(path.dirname(file.path)));
    raml2html.render(file.contents, options.config).then(
      function (output) {
        process.chdir(cwd);
        stream.push(new gutil.File({
          base: file.base,
          cwd: file.cwd,
          path: gutil.replaceExtension(file.path, options.extension),
          contents: new Buffer(output)
        }));
        done();
      },
      function (error) {
        process.chdir(cwd);
        simplifyMark(error.context_mark);
        simplifyMark(error.problem_mark);
        process.nextTick(function () {
          fail(JSON.stringify(error, null, 2));
        });
      });
  });

  return stream;
}

module.exports = gulpRaml2Html;
