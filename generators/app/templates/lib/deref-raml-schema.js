'use strict';

var async = require('async');
var jsrp = require('json-schema-ref-parser');
var traverse = require('traverse');
var through2 = require('through2');
var gutil = require('gulp-util');
var utils = require('./utils.js');

function reportTaskError(err) {
  if (err) {
    gutil.log('Task Error: ', err);
  }
}

function dereferenceSchema(task, cb) {
  task.parser.dereference(task.schema, function (err, schema) {
    if (err) {
      return cb(err);
    }
    task.context.update(JSON.stringify(schema, null, '  '));
    cb();
  });
}

function derefSchemas(obj, schemaFolder, cb) {
  var q = async.queue(dereferenceSchema),
    refParser = new jsrp(),
    previousDir = process.cwd(),
    paramRe = /<<[^>]+>>/,
    json;

  process.chdir(schemaFolder);

  traverse(obj).forEach(function (x) {
    if (this.isLeaf && (this.key === 'schema' ||
      (this.parent && this.parent.parent && this.parent.parent.key === 'schemas'))) {
      if (!paramRe.test(x)) {
        try {
          json = JSON.parse(x);
          q.push({
            schema: json,
            context: this,
            parser: refParser
          }, reportTaskError);
        } catch (err) {
          gutil.log('Error!', this.path.join('/'), err, '\n', x);

          cb(new gutil.PluginError('deref-raml-schema', 'Unable to parse schema at path ' + this.path.join('/') + ' ' + err));
        }
      }
    }
  });
  q.drain = function () {
    process.chdir(previousDir);
    cb(null, obj);
  };
}

function derefRamlSchema(schemaFolder) {
  var stream = through2.obj(function (file, enc, done) {
    var raml, fail = function (message) {
      done(message);
    };
    if (file.isBuffer()) {
      raml = JSON.parse(file.contents.toString(enc));
      derefSchemas(raml, schemaFolder, function (err, raml) {
        stream.push(new gutil.File({
          base: file.base,
          cwd: file.cwd,
          path: file.path,
          contents: new Buffer(JSON.stringify(raml))
        }));
        done();
      });
    } else if (file.isStream()) {
      fail('Streams are not supported: ' + file.inspect());
    } else if (file.isNull()) {
      fail('Input file is null: ' + file.inspect());
    }
  });

  return stream;
}

module.exports = derefRamlSchema;
