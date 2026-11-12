// Copyright (C) 2026 Shaffarullah Abdul Rahman
//
// This file is part of Kibitz's Stockfish packaging and is free software: you can
// redistribute it and/or modify it under the terms of the GNU General Public License as
// published by the Free Software Foundation, either version 3 of the License, or (at your
// option) any later version. It is distributed WITHOUT ANY WARRANTY; without even the
// implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// General Public License for more details: https://www.gnu.org/licenses/gpl-3.0.html
// Source: https://github.com/shaff3874/kibitz-engine-source

/* Kibitz's Strong engine: Stockfish 19 with its full network (about 94 MB), for Kibitz's own site.
   Cloudflare serves files of up to 25 MB, so the engine's .wasm is stored in parts. This worker joins them,
   keeps them in this site's cache so the download happens once, and hands the engine one whole file.
   Progress lines ("kibitz download <bytes> <total>") are posted for the page; the engine ignores them. */
(function () {
  'use strict';
  var PARTS = __PARTS__, TOTAL = __TOTAL__, CACHE = '__CACHE__';
  var realFetch = self.fetch.bind(self), joined = null;
  function partUrl(i) { return '__WASM__.part' + i; }
  function getPart(cache, i, onBytes) {
    var url = partUrl(i);
    return (cache ? cache.match(url) : Promise.resolve(null)).then(function (hit) {
      if (hit) return hit.arrayBuffer().then(function (b) { onBytes(b.byteLength); return b; });
      return realFetch(url, { credentials: 'same-origin' }).then(function (res) {
        if (!res.ok) throw new Error('engine part ' + i + ': HTTP ' + res.status);
        var copy = res.clone();
        return res.arrayBuffer().then(function (b) {
          onBytes(b.byteLength);
          if (cache) cache.put(url, copy).catch(function () { /* storage full: fine, it downloads next time */ });
          return b;
        });
      });
    });
  }
  function joinParts() {
    if (joined) return joined;
    var loaded = 0, last = 0;
    var onBytes = function (n) {
      loaded += n;
      var now = Date.now();
      if (now - last > 400 || loaded >= TOTAL) { last = now; try { self.postMessage('kibitz download ' + loaded + ' ' + TOTAL); } catch (e) { /* ignore */ } }
    };
    var open = self.caches && self.caches.open ? self.caches.open(CACHE).catch(function () { return null; }) : Promise.resolve(null);
    joined = open.then(function (cache) {
      var jobs = []; for (var i = 0; i < PARTS; i++) jobs.push(getPart(cache, i, onBytes));
      return Promise.all(jobs);
    }).then(function (bufs) { return new Blob(bufs, { type: 'application/wasm' }); });
    return joined;
  }
  self.fetch = function (input, init) {
    var u = typeof input === 'string' ? input : (input && input.url) || '';
    if (/\.wasm(\?|#|$)/.test(u) && !/\.part\d+/.test(u)) {
      return joinParts().then(function (blob) { return new Response(blob, { status: 200, headers: { 'Content-Type': 'application/wasm' } }); });
    }
    return realFetch(input, init);
  };
  importScripts('__SCRIPT__');
})();
