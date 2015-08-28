/** @module gulpRamlParser */
'use strict';

var ramlParser = require('raml-parser'),
  gutil = require('gulp-util'),
  through2 = require('through2');

function reportError(message, context, err) {
  var msg = message || 'Error';
  if (context) {
    msg += ' at path: [' + context.path.join('/') + ']';
  }
  if (err) {
    msg += ' ' + err.toString();
  }
  return new gutil.PluginError('raml-parser', msg);
}

function ramlParserFunc(file, enc, callback) {
  var stream = this,
    fail = function (message, err) {
      return callback(reportError(message, null, err));
    };

  if (file.isStream()) {
    return fail('Streams are not supported: ' + file.inspect());
  } else if (file.isNull()) {
    return fail('Input file is null: ' + file.inspect());
  } else if (!file.isBuffer()) {
    return fail('Expected a buffer: ' + file.inspect());
  }

  ramlParser.load(file.contents.toString(enc))
    .then(function () {
      stream.push(new gutil.File({
        base: file.base,
        cwd: file.cwd,
        path: file.path,
        contents: new Buffer(file.contents.toString(enc))
      }));
      callback();
    }, function (err) {
      fail('Error parsing RAML', err);
    });
}

function ramlParserPlugin() {
  return through2.obj(ramlParserFunc);
}

/** Gulp plugin to validate that RAML Parser can parse the input RAML file */
module.exports = ramlParserPlugin;
