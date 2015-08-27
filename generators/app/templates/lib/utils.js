/** @module utils */
'use strict';

var traverse = require('traverse');

/**
 * Helper function to pretty-print RAML documents
 * @arg ramlObj object containing the RAML document
 * @returns string version of the RAML object
 */
function prettyJsonRaml(ramlObj) {
  return JSON.stringify(traverse(ramlObj).map(function (value) {
    if (typeof value === 'string' && value.length > 20) {
      this.update(value.slice(0, 19) + '...');
    }
  }), null, '  ');
}

/** pretty print RAML JSON object */
module.exports.prettyJsonRaml = prettyJsonRaml;
