'use strict';

/*globals
    describe, it, before
*/
var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;

describe('ramlapi:app', function () {
  before(function (done) {
    helpers.run(path.join(__dirname, '../generators/app'))
      .withOptions({
        skipInstall: true
      })
      .withPrompts({
        projectTitle: 'example',
        projectName: 'example'
      })
      .on('end', done);
  });

  it('creates files', function () {
    assert.file([
      'package.json',
      '.editorconfig',
      '.gitignore',
      'README.md',
      'templates/item.nunjucks',
      'templates/resource.nunjucks',
      'templates/template.nunjucks',
      'schema/accepted.json',
      'schema/date-time.json',
      'raml/acceptances.raml',
      'examples/accepted.json'
    ]);
  });
});