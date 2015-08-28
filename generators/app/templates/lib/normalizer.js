/** @module normalizer */
'use strict';

/**
 * Prevents potential dup of term API in title,
 * double 'v' in the version number, and
 * double final slash in the URI, in final html
 * template rendering.  Without disturbing the
 * RAML project template: _project.raml
 */
function normalizer() {
    this.normalizeTitle = function(s) {
        if (s) return s = s.replace(/api/ig, '').trim();
    };
    this.normalizeUri = function(s) {
        if (s) return s = s.replace(/\/$/, '').trim();
    };
    this.normalizeVersion = function(s) {
        if (s) return s = s.replace(/v/ig, '').trim();
    };
};

module.exports.normalizer = normalizer;
