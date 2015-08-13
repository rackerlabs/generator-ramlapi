'use strict';

var through2 = require('through2');
var gutil = require('gulp-util');
var traverse = require('traverse');

function fixResources(obj, cb) {
  traverse(obj).forEach(function (x) {
    var k;
    if (this.parent && this.parent.key === 'resources') {
      k = x.relativeUri;
      delete x.relativeUri;
      delete x.relativeUriPathSegments;
      this.parent.parent.node[k] = x;
      if (this.parent.node.length <= 1) {
        this.parent.remove();
      } else {
        this.remove();
      }
    }
  });

  cb(null, obj);
}

function fixMethods(obj, cb) {
  var k;
  traverse(obj).forEach(function (x) {
    if (this.parent && this.parent.key === 'methods') {
      k = x.method;
      delete x.method;
      this.parent.parent.node[k] = x;
      if (this.parent.node.length <= 1) {
        this.parent.remove();
      } else {
        this.remove();
      }
    }
  });

  cb(null, obj);
}

function jsonToRamlStruct() {
  var stream = through2.obj(function (file, enc, done) {
    var fail = function (message) {
      done(new gutil.PluginError('json-to-raml-struct', message));
    };
    if (file.isBuffer()) {
      fixResources(JSON.parse(file.contents.toString(enc)), function (err, updatedRes) {
        fixMethods(updatedRes, function (err, updatedData) {
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
    } else if (file.isStream()) {
      fail('Streams are not supported: ' + file.inspect());
    } else if (file.isNull()) {
      fail('Input file is null: ' + file.inspect());
    }
  });

  return stream;
}

module.exports = jsonToRamlStruct;
