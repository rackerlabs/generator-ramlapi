/**
 * test-normalizer.js
 **/
'use strict';

/**
 *
 * globals
 * describe, it, before
 *
 **/
var assert = require('assert');
var normalize = require('../generators/app/templates/lib/normalizer');
var normal = new normalize.normalizer();

describe('normalize-title', function () {
    var title = "RAML Time Vortex API";
    var expected = "RAML Time Vortex";
    var actual = "";
    before(function (done) {
        actual = normal.normalizeTitle(title);
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
        actual = normal.normalizeUri(uri);
        done();
    });
    it('removes trailing slash', function () {
        assert.deepEqual(actual, expected, 'transformed object != expected');
    });
});

describe('normalize-uri', function () {
    var uri = "v1.01";
    var expected = "1.01";
    var actual = "";
    before(function (done) {
        actual = normal.normalizeVersion(uri);
        done();
    });
    it('removes trailing slash', function () {
        assert.deepEqual(actual, expected, 'transformed object != expected');
    });
});



