'use strict';

var async = require('async');
var jsrp = require('json-schema-ref-parser');
var traverse = require('traverse');
var through2 = require('through2');
var gutil = require('gulp-util');

function reportTaskError(err) {
  if (err) {
    console.log('Task Error: ' + err);
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
    previousDir = process.cwd();
  process.chdir(schemaFolder);

  traverse(obj).forEach(function (x) {
    if (this.isLeaf && (this.key === 'schema' ||
      (this.parent && this.parent.parent && this.parent.parent.key === 'schemas'))) {
      q.push({
        schema: JSON.parse(x),
        context: this,
        parser: refParser
      }, reportTaskError);
    }
  });

  q.drain = function () {
    process.chdir(previousDir);
    cb(null, obj);
  };
}

function derefRamlSchema(schemaFolder) {
  var ramlparser = require('raml-parser');

  var stream = through2.obj(function (file, enc, done) {
    var fail = function (message) {
      done(new gutil.PluginError('deref-raml-schema', message));
    };
    if (file.isBuffer()) {
      ramlparser.load(file.contents.toString(enc)).then(function (raml) {
        derefSchemas(raml, schemaFolder, function (err, raml) {
          stream.push(new gutil.File({
            base: file.base,
            cwd: file.cwd,
            path: file.path,
            contents: new Buffer(JSON.stringify(raml))
          }));
          done();
        });
      }, function (error) {
        console.log('Error parsing: ' + error);
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
