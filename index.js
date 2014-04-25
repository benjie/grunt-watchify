/*
 * grunt-watchify
 * http://github.com/amiorin/grunt-watchify
 *
 * Copyright (c) 2013 Alberto Miorin, contributors
 * Licensed under the MIT license.
 */

'use strict';

var fs         = require('fs');
var browserify = require('browserify');
var watch = require('chokidar').watch;

module.exports = function (opts, gruntCb) {
  var b          = gruntCb(browserify(opts));
  var cache      = {};
  var pkgcache   = {};
  var watching   = {};

  b.on('package', function (file, pkg) {
    pkgcache[file] = pkg;
  });

  b.on('dep', function (dep) {
    if (watching[dep.id]) {
      return;
    }
    watching[dep.id] = true;
    cache[dep.id] = dep;

    var fw = watch(dep.id, {persistent: true});
    fw.on('change', function(event, filename) {
      delete cache[dep.id];
      b.emit('update');
    });
  });

  var bundle = b.bundle.bind(b);
  var first = true;
  b.bundle = function (_opts, cb) {
    if (b._pending) {
      return bundle(_opts, cb);
    }

    if (typeof _opts === 'function') {
      cb = _opts;
      _opts = {};
    }
    if (!_opts) {
      _opts = {};
    }
    if (!first) {
      _opts.cache = cache;
    }
    _opts.includePackage = true;
    _opts.packageCache = pkgcache;
    first = false;

    return bundle(_opts, cb);
  };

  return b;
};

