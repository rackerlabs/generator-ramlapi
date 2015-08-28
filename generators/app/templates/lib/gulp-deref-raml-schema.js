/** @module gulpDerefRamlSchema */
'use strict';

var async = require('async');
var jsrp = require('json-schema-ref-parser');
var traverse = require('traverse');
var through2 = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs');

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
  return new gutil.PluginError('deref-raml-schema', msg);
}

/**
 * Dereferences a RAML schema instance
 * @private
 * @arg task async task containing the reference to the JSON schema to be dereferenced
 * @arg cb callback to indicate error or dereference is complete
 */
function dereferenceSchema(task, cb) {
  var json,
    schemaPath,
    schema = task.schema,
    paramRe = /<<[^>]+>>/;

  if (paramRe.test(schema)) {
    return cb();
  }

  schemaPath = path.resolve(task.baseFolder, schema);
  if (fs.existsSync(schemaPath)) {
    schema = fs.readFileSync(schemaPath, task.enc);
  }

  try {
    json = JSON.parse(schema);
  } catch (err) {
    return cb(reportError('Unable to parse schema', this, err));
  }

  new jsrp().dereference(json, function (err, schema) {
    if (err) {
      return cb(reportError('Dereference Error', task.context, err));
    }
    task.context.update(JSON.stringify(schema, null, '  '));
    cb();
  });
}

/**
 * Dereferences JSON schema references in a RAML object
 * @private
 * @arg {object} obj RAML JSON object
 * @arg {string} baseFolder of main RAML file
 * @arg {string} schemaFolder base folder containing the JSON schema files
 * @arg cb callback to indicate error or dereferences are complete
 */
function derefSchemas(obj, baseFolder, schemaFolder, cb) {
  var q = async.queue(dereferenceSchema),
    previousDir = process.cwd();

  // I don't like changing the process working dir but the deref library
  // only looks for schema in the cwd.
  process.chdir(schemaFolder);

  traverse(obj).forEach(function (x) {
    if (this.isLeaf && (this.key === 'schema' ||
      (this.parent && this.parent.parent && this.parent.parent.key === 'schemas'))) {
      q.push({
        schema: x,
        context: this,
        baseFolder: baseFolder
      });
    }
  });
  q.drain = function () {
    process.chdir(previousDir);
    cb(null, obj);
  };
}

/**
 * Gulp plugin function to dereference all JSON schema references in a RAML file
 * @arg {string} schemaFolder base folder for JSON schema file references
 * @returns a Gulp plugin function that dereferences JSON Schema referenced in
 *          the RAML
 */
function derefRamlSchemaFunc(schemaFolder) {
  return function (file, enc, done) {
    var raml, stream = this, fail = function (message, err) {
      return done(reportError(message, null, err));
    };

    if (file.isStream()) {
      return fail('Streams are not supported: ' + file.inspect());
    } else if (file.isNull()) {
      return fail('Input file is null: ' + file.inspect());
    } else if (!file.isBuffer()) {
      return fail('Expected a buffer: ' + file.inspect());
    }

    try {
      raml = JSON.parse(file.contents.toString(enc));
    } catch(err) {
      fail('Error parsing RAML', err);
    }
    derefSchemas(raml, file.cwd, schemaFolder, function (err, raml) {
      if (err) {
        return fail(err);
      }
      stream.push(new gutil.File({
        base: file.base,
        cwd: file.cwd,
        path: file.path,
        contents: new Buffer(JSON.stringify(raml))
      }));
      done();
    });
  };
}

/** Gulp method to derefererence JSON Schema in the RAML file */
module.exports = function derefRamlSchema(schemaFolder) {
  return through2.obj(derefRamlSchemaFunc(schemaFolder));
};
