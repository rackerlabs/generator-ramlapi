'use strict';

var mapStream = require('map-stream');
var gutil = require('gulp-util');
var c = gutil.colors;
var tv4 = require('tv4');
var through = require('through2');
var PluginError = require('gulp-util').PluginError;
var traverse = require('traverse');

var matches = [];

function isBodyPath(pathAry) {
  return pathAry.some(function (cv) { return cv === 'body'; });
}

function isNewPath(pathAry) {
  var pathStr = pathAry.join('/');
  if (matches.some(function (cv) { return cv === pathStr; })) {
    return false;
  }
  matches = matches.concat(pathStr);
  return true;
}

function validateSchemaExample(schema, example) {
  var result = tv4.validateMultiple(JSON.parse(example), JSON.parse(schema));
  if (result.missing.length > 0) {
    console.log('Missing Schemas: ' + JSON.stringify(result.missing, null, '  '));
  }
  if (!result.valid) {
    throw new Error(result.errors.map(function (error) {
      return [
        error.message,
        'at Example path: ' + error.dataPath,
        'Schema path: ' + error.schemaPath
      ].join('\n');
    }).join('\n\n'));
  }
}

function lookForExamples(ramlObj) {
  matches = [];
  traverse(ramlObj).forEach(function (x) {

    if (this.key === 'schema') {
      // Look for a matching example
      if (this.parent.node.example) {
        if (isNewPath(this.parent.path)) {
          validateSchemaExample(x, this.parent.node.example);
        }
      } else {
        if (isNewPath(this.parent.path)) {
          console.log('Warning: schema ' + this.path.join('/') + ' missing example');
        }
      }
    } else if (this.key === 'example') {
      // Look for a matching schema
      if (isBodyPath(this.path)) {
        if (this.parent.node.schema) {
          if (isNewPath(this.parent.path)) {
            validateSchemaExample(this.parent.node.schema, x);
          }
        } else {
          if (isNewPath(this.parent.path)) {
            console.log('Warning: example ' + this.path.join('/') + ' missing schema');
          }
        }
      }
    }
  });
}

var formatOutput = function (msg) {
  var output = {};

  if (msg) {
    output.message = msg;
  }

  output.success = msg ? false : true;

  return output;
};

var validateExamplesPlugin = function (options) {
  options = options || {};

  return mapStream(function (file, cb) {
    var errorMessage = '',
      ramlObj;

    try {
      ramlObj = JSON.parse(String(file.contents));
      lookForExamples(ramlObj);
    } catch (err) {
      errorMessage = err.message;
    }
    file.validateExamples = formatOutput(errorMessage);

    cb(null, file);
  });
};

var defaultReporter = function (file) {
  gutil.log(c.yellow('Error on file ') + c.magenta(file.path));
  gutil.log(c.red(file.validateExamples.message));
};

validateExamplesPlugin.reporter = function (customReporter) {
  var reporter = defaultReporter;

  if (typeof customReporter === 'function') {
    reporter = customReporter;
  }

  return mapStream(function (file, cb) {
    if (file.validateExamples && !file.validateExamples.success) {
      reporter(file);
    }
    return cb(null, file);
  });
};

/**
 * Fail when an validateExamples error is found in validateExamples results.
 */
validateExamplesPlugin.failOnError = function () {

  return through.obj(function (file, enc, cb) {
    var error;
    if (file.validateExamples.success === false) {
      error = new PluginError(
        'validate-examples', {
          name: 'ValidateExamplesError',
          filename: file.path,
          message: file.validateExamples.message,
        }
      );
    }

    return cb(error, file);
  });
};

/**
 * Fail when the stream ends if any validateExamples error(s) occurred
 */
validateExamplesPlugin.failAfterError = function () {
  var errorCount = 0;

  return through.obj(function (file, enc, cb) {
    errorCount += file.validateExamples.success === false;

    cb(null, file);

  }, function (cb) {
    if (errorCount > 0) {
      this.emit('error', new PluginError(
        'validate-examples', {
          name: 'ValidateExamplesError',
          message: 'Failed with ' + errorCount +
            (errorCount === 1 ? ' error' : ' errors')
        }
      ));
    }

    cb();
  });
};

module.exports = validateExamplesPlugin;