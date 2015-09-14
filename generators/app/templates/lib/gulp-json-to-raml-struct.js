/** @module gulpJsonToRamlStruct */
'use strict';

var through2 = require('through2');
var gutil = require('gulp-util');
var traverse = require('traverse');
var path = require('path');
var ramlparser = require('raml-parser');

/**
 * Produces a meaningful PluginError instance with a message, optional context
 * to indicate where the error occurred, and optional exception.
 * @private
 * @arg {string} message free text message to report
 * @arg {object} context that responds to the path method to show where the error occurred
 * @arg err an optional Error instance
 * @returns a new gutil.PluginError instance
 */
function reportError(message, context, err) {
  var msg = message || 'Error';
  if (context) {
    msg += ' at path: [' + context.path.join('/') + ']';
  }
  if (err) {
    msg += ' ' + err.toString();
  }
  return new gutil.PluginError('json-to-raml-struct', msg);
}

function resourceTransfer(item, collectionParentPath, traverseObj) {
  var relativeUri = item.relativeUri;
  delete item.relativeUri;
  delete item.relativeUriPathSegments;
  traverseObj.set(collectionParentPath.concat(relativeUri), item);
}

function methodTransfer(item, collectionParentPath, traverseObj) {
  var itemId = item.method;
  delete item.method;
  traverseObj.set(collectionParentPath.concat(itemId), item);
}

function fix(obj, targetElement, itemTransfer, cb) {
  try {
    var trObj = traverse(obj);
    // Sort longest paths first to ensure children are processed before parents
    var paths = trObj.paths().sort(function (a, b) { return b.length - a.length; });
    // Reduce to only the immediate children of resources elements
    paths = paths.reduce(function (pv, cv) {
      if (cv[cv.length - 1] === targetElement) {
        pv.push(cv);
      }
      return pv;
    }, []);
    // Move each resource to its correct destination under parent
    paths.forEach(function (collectionPath) {
      var collection = trObj.get(collectionPath),
        collectionParentPath = collectionPath.slice(0, -1),
        collectionParent = trObj.get(collectionParentPath);
      collection.forEach(function (item) {
        itemTransfer(item, collectionParentPath, trObj);
      });
      delete collectionParent[targetElement];
    });
  } catch (err) {
    cb(reportError('Error in fixMethods', null, err));
  }
  cb(null, obj);
}

function extname(file) {
  return file.extname || path.extname(file.path);
}

function correctRamlStructure(stream, file, ramlObj, done) {
  fix(ramlObj, 'resources', resourceTransfer, function (err, updatedRes) {
    fix(updatedRes, 'methods', methodTransfer, function (err, updatedData) {
      if (updatedData.baseUriParameters && updatedData.baseUriParameters.version) {
        delete updatedData.baseUriParameters.version;
      }
      stream.push(new gutil.File({
        base: file.base,
        cwd: file.cwd,
        path: file.path,
        contents: new Buffer(JSON.stringify(updatedData))
      }));
      done();
    });
  });
}

function doWorkFromRaml(stream, file, enc, done) {
  ramlparser.load(file.contents.toString(enc)).then(function (ramlObj) {
    correctRamlStructure(stream, file, ramlObj, done);
  }, function (error) {
    done(reportError('Error parsing RAML', null, error));
  });
}

function doWorkFromJson(stream, file, enc, done) {
  var ramlObj = JSON.parse(file.contents.toString(enc));
  correctRamlStructure(stream, file, ramlObj, done);
}

/**
 * Converts a RAML file as JSON with transformations from RAML Parser to
 * to a pure RAML structure.
 */
module.exports = function jsonToRamlStruct() {
  var stream = through2.obj(function (file, enc, done) {
    var fail = function (message) {
      done(reportError(message));
    };

    if (file.isStream()) {
      return fail('Streams are not supported: ' + file.inspect());
    } else if (file.isNull()) {
      return fail('Input file is null: ' + file.inspect());
    } else if (!file.isBuffer()) {
      return fail('Expected a buffer: ' + file.inspect());
    }

    if (extname(file) === '.raml') {
      doWorkFromRaml(stream, file, enc, done);
    } else { // json
      doWorkFromJson(stream, file, enc, done);
    }
  });

  return stream;
};
