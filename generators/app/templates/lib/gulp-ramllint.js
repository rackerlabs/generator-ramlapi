'use strict';

var mapStream = require('map-stream'),
  gutil = require('gulp-util'),
  c = gutil.colors,
  Linter = require('ramllint'),
  options = {
    'url_lower': '^\\/([a-z]+(-[a-z]+)*|{[a-z]+([A-Z][a-z]+)*})$'
  },
  linter = new Linter(options),
  through = require('through2'),
  PluginError = require('gulp-util').PluginError;

var STATUS = {
  'error': gutil.colors.red,
  'info': gutil.colors.blue,
  'warning': gutil.colors.yellow
};

var formatOutput = function (results) {
  var errResults = {
      'error': 0,
      'info': 0,
      'warning': 0
    },
    output = {},
    msg;

  results.forEach(function entryFormat(entry) {
    var infoMsg = STATUS[entry.level](entry.level.toUpperCase()) + ' ' +
      entry.rule + '\n' +
      '  ' + entry.message + gutil.colors.blue(' [' + entry.code + ']') +
      (entry.hint ? gutil.colors.yellow('\nHINT:\n') + entry.hint : '');

    gutil.log(infoMsg);
    errResults[entry.level] += 1;
  });

  msg = 'Errors: ' + errResults.error +
    ', Warnings: ' + errResults.warning +
    ', Info: ' + errResults.info;
  output.success = (errResults.error + errResults.warning === 0);
  output.message = msg;

  return output;
};

var ramlLintPlugin = function (options) {
  // TODO: add support for ramllint options
  options = options || {};

  return mapStream(function (file, cb) {
    var errorMessage = '';

    try {
      linter.lint(String(file.contents), function () {
        file.ramllint = formatOutput(linter.results());

        cb(null, file);
      });
    } catch (err) {
      errorMessage = err.message;
    }
  });
};

var defaultReporter = function (file) {
  gutil.log(c.yellow('Error on file ') + c.magenta(file.path));
  gutil.log(c.red(file.ramllint.message));
};

ramlLintPlugin.reporter = function (customReporter) {
  var reporter = defaultReporter;

  if (typeof customReporter === 'function') {
    reporter = customReporter;
  }

  return mapStream(function (file, cb) {
    if (file.ramllint && !file.ramllint.success) {
      reporter(file);
    }
    return cb(null, file);
  });
};

/**
 * Fail when an ramllint error is found in ramllint results.
 */
ramlLintPlugin.failOnError = function () {

  return through.obj(function (file, enc, cb) {
    if (file.ramllint.success === false) {
      var error = new PluginError(
        'gulp-ramllint', {
          name: 'RAMLLintError',
          filename: file.path,
          message: file.ramllint.message,
        }
      );
      return cb(error);
    }

    return cb(null, file);
  });
};

/**
 * Fail when the stream ends if any ramllint error(s) occurred
 */
ramlLintPlugin.failAfterError = function () {
  var errorCount = 0;

  return through.obj(function (file, enc, cb) {
    errorCount += file.ramllint.success === false;

    cb(null, file);

  }, function (cb) {
    if (errorCount > 0) {
      this.emit('error', new PluginError(
        'gulp-ramllint', {
          name: 'RAMLLintError',
          message: 'Failed with ' + errorCount +
            (errorCount === 1 ? ' error' : ' errors')
        }
      ));
    }

    cb();
  });
};

module.exports = ramlLintPlugin;