'use strict';

/*globals
    describe, it
*/
var assert = require('assert');
var gutil = require('gulp-util');
var path = require('path');
var ramlParser = require('raml-parser');
var fs = require('fs');

var fixRamlOutput = require('../generators/app/templates/lib/fix-raml-output');

describe('fix-raml-output', function () {
  it('converts YAML folding style string scalars to flow style', function (done) {
    var inputFile = path.resolve(__dirname, 'samples/schemas.raml');
    ramlParser.loadFile(inputFile, {transform: false})
      .then(function (inputRamlObj) {
        fs.readFile(path.resolve(__dirname, 'samples/fix-raml-output-expected.raml'), function (err, expectedRamlData) {
          var expectedRaml;
          if (err) {
            assert.fail('Unable to read expected RAML' + err);
            done(err);
          }

          expectedRaml = expectedRamlData.toString();

          // Code under test
          var th2 = fixRamlOutput();

          th2.on('error', function (err) {
            assert.fail('Error was signalled ' + err);
            done(err);
          });

          // Test response to data written onto stream
          th2.on('data', function (actual) {
            var actualRaml = actual.contents.toString();
            assert.deepEqual(actualRaml, expectedRaml, 'transformed object != expected');
            done();
          });

          // Write test cases onto the stream
          th2.write(new gutil.File({
            base: path.basename(inputFile.basename),
            cwd: path.dirname(inputFile),
            path: path.dirname(inputFile),
            contents: new Buffer(JSON.stringify(inputRamlObj))
          }));

          th2.end();
        });
      });
  });
});
