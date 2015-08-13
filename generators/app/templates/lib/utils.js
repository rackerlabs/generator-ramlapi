'use strict';

var traverse = require('traverse');

function prettyJsonRaml(ramlObj) {
  return JSON.stringify(traverse(ramlObj).map(function (value) {
    if (typeof value === 'string' && value.length > 20) {
      this.update(value.slice(0, 19) + '...');
    }
  }), null, '  ');
}

module.exports.prettyJsonRaml = prettyJsonRaml;
