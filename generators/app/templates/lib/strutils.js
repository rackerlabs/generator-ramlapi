/*** @module strutils ***/

'use strict';

var _s = require('underscore.string');

var strutils = function () {

  this.normalizeTitle = function (s) {
    if (s) {
      return s.replace(/api/ig, '').trim();
    }
  };

  this.normalizeUri = function (s) {
    if (s) {
      return s.replace(/\/$/, '').trim();
    }
  };

  this.normalizeVersion = function (s) {
    if (s) {
      return s.replace(/v/ig, '').trim();
    }
  };

  this.titleize = function (s) {
    return _s.titleize(s);
  };

  this.camelize = function (s) {
    return _s.camelize(s);
  };

  this.classify = function (s) {
    return _s.classify(s);
  };

};

module.exports.strutils = strutils;

