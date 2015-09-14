/**
 * test-strutils.js
 **/

'use strict';

/**
 * globals
 * describe, it, before
 **/
var assert = require('assert');
var strutils = require('../generators/app/templates/lib/strutils');
var strutil = new strutils.strutils();

describe('normalize-title', function () {
  var title = "RAML Time Vortex API";
  var expected = "RAML Time Vortex";
  var actual = "";
  before(function (done) {
    actual = strutil.normalizeTitle(title);
    done();
  });
  it('removes API', function () {
    assert.deepEqual(actual, expected, 'transformed object != expected');
  });
});

describe('normalize-uri', function () {
  var uri = "https://github.com/ktroach/generator-ramlapi//";
  var expected = "https://github.com/ktroach/generator-ramlapi/";
  var actual = "";
  before(function (done) {
    actual = strutil.normalizeUri(uri);
    done();
  });
  it('removes trailing slash', function () {
    assert.deepEqual(actual, expected, 'transformed object != expected');
  });
});

describe('normalize-version', function () {
  var uri = "v1.01";
  var expected = "1.01";
  var actual = "";
  before(function (done) {
    actual = strutil.normalizeVersion(uri);
    done();
  });
  it('removes duplicate v', function () {
    assert.deepEqual(actual, expected, 'transformed object != expected');
  });
});

describe('titleize', function () {
  var title = "widget warehouse";
  var expected = "Widget Warehouse";
  var actual = "";
  before(function (done) {
    actual = strutil.titleize(title);
    done();
  });
  it('titleizes', function () {
    assert.deepEqual(actual, expected, 'transformed object != expected');
  });
});

describe('camelize', function () {
  var title = "widget-warehouse";
  var expected = "Widget-Warehouse";
  var actual = "";
  before(function (done) {
    actual = strutil.titleize(title);
    done();
  });
  it('camelizes', function () {
    assert.deepEqual(actual, expected, 'transformed object != expected');
  });
});

describe('classify', function () {
  var title = "some_class_name";
  var expected = "SomeClassName";
  var actual = "";
  before(function (done) {
    actual = strutil.classify(title);
    done();
  });
  it('classifies', function () {
    assert.deepEqual(actual, expected, 'transformed object != expected');
  });
});



