'use strict';

/*globals
    describe, it
*/
var assert = require('assert');
var gutil = require('gulp-util');
var path = require('path');
var ramlParser = require('raml-parser');

var derefRamlSchema = require('../generators/app/templates/lib/gulp-deref-raml-schema');

describe('gulp-deref-raml-schema', function () {
  it('properly deserialized schema references', function (done) {

    var schemaFile = path.resolve(__dirname, 'samples/schemas.raml'),
      schemaFolder = path.resolve(__dirname, 'samples/schemas'),
      expectedPersonSchema = require('./samples/schemas/expected-person.json'),
      expectedCarSchema = require('./samples/schemas/car.json');

    ramlParser.loadFile(schemaFile, {transform: false}).then(
      function (inputRamlObj) {
        // Code under test
        var th2 = derefRamlSchema(schemaFolder);

        th2.on('error', function (err) {
          console.log('caught an error');
          assert.fail(err);
          done(err);
        });

        // Test response to data written onto stream
        th2.on('data', function (actual) {
          var ramlObj = JSON.parse(actual.contents.toString()),
            actualPersonSchema = JSON.parse(ramlObj.schemas[0].person),
            actualCarSchema = JSON.parse(ramlObj['/car'].get.responses[200].body['application/json'].schema);
          assert.deepEqual(actualPersonSchema, expectedPersonSchema, 'transformed object != expected');
          assert.deepEqual(actualCarSchema, expectedCarSchema, 'transformed object != expected');
          done();
        });

        // Write test cases onto the stream
        th2.write(new gutil.File({
          base: path.basename(schemaFile.basename),
          cwd: path.dirname(schemaFile),
          path: path.dirname(schemaFile),
          contents: new Buffer(JSON.stringify(inputRamlObj))
        }));

        th2.end();
      });
  });
});
