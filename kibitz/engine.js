// Copyright (C) 2026 Shaffarullah Abdul Rahman
//
// This file is part of Kibitz's Stockfish packaging and is free software: you can
// redistribute it and/or modify it under the terms of the GNU General Public License as
// published by the Free Software Foundation, either version 3 of the License, or (at your
// option) any later version. It is distributed WITHOUT ANY WARRANTY; without even the
// implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// General Public License for more details: https://www.gnu.org/licenses/gpl-3.0.html
// Source: https://github.com/shaff3874/kibitz-engine-source

// Copies Stockfish 19 from the npm package into public/engine.
// Standard engine (Lite network): multi-threaded (used when the page is cross-origin isolated) and single-threaded.
// Strong engine (full network, about 94 MB, opt-in on the Review page), multi-threaded and single-threaded.
// Cloudflare serves files up to 25 MB, so each Strong .wasm is split into parts that a small loader joins in the browser.
const fs = require('fs'), path = require('path');
const bin = path.join(path.dirname(require.resolve('stockfish/package.json')), 'bin');
const out = path.join(__dirname, '..', 'public', 'engine');
fs.mkdirSync(out, { recursive: true });
for (const f of ['stockfish-19-lite.js', 'stockfish-19-lite.wasm', 'stockfish-19-lite-single.js', 'stockfish-19-lite-single.wasm', 'stockfish-19.js', 'stockfish-19-single.js']) {
  fs.copyFileSync(path.join(bin, f), path.join(out, f));
  console.log('engine/' + f, (fs.statSync(path.join(out, f)).size / 1048576).toFixed(1) + ' MB');
}
const template = fs.readFileSync(path.join(__dirname, 'sf-full.js'), 'utf8');
const PART = 20 * 1024 * 1024;
for (const [name, loader, cache] of [['stockfish-19', 'sf-full.js', 'kibitz-engine-sf19-full-v1'], ['stockfish-19-single', 'sf-full-single.js', 'kibitz-engine-sf19-full-single-v1']]) {
  const wasm = fs.readFileSync(path.join(bin, name + '.wasm'));
  const parts = Math.ceil(wasm.length / PART);
  fs.readdirSync(out).filter(f => f.startsWith(name + '.wasm.part')).forEach(f => fs.unlinkSync(path.join(out, f)));
  for (let i = 0; i < parts; i++) fs.writeFileSync(path.join(out, name + '.wasm.part' + i), wasm.subarray(i * PART, (i + 1) * PART));
  fs.writeFileSync(path.join(out, loader), template.replace('__PARTS__', String(parts)).replace('__TOTAL__', String(wasm.length)).replace('__CACHE__', cache).replace('__WASM__', name + '.wasm').replace('__SCRIPT__', name + '.js'));
  console.log('engine/' + name + '.wasm in ' + parts + ' parts (' + (wasm.length / 1048576).toFixed(1) + ' MB), joined by engine/' + loader);
}
