# Kibitz engine source

Kibitz (https://kibitz.shaffarullah.workers.dev) is a chess review app that runs Stockfish 19 in your web browser. Stockfish is free software under the GNU General Public License, version 3. This repository keeps a copy of everything needed to get the complete source of the engine files Kibitz serves, so it stays available even if an upstream link changes.

The Kibitz app itself is not open source. It runs Stockfish as a separate program (a Web Worker) and only exchanges UCI text commands with it.

## What Kibitz serves

The engine files from the official Stockfish.js 19.0.1 release by Nathan Rugg (published by Chess.com), unchanged:

- Standard: `stockfish-19-lite.js/.wasm` and `stockfish-19-lite-single.js/.wasm`, with the network nn-61e7af4bb97d by Chris Bao built in.
- Strong: `stockfish-19.js/.wasm` and `stockfish-19-single.js/.wasm`, with Stockfish 19's official network nn-1a298aa575a0 built in.

The Strong `.wasm` files are larger than the hosting service allows in one file, so Kibitz serves each in five 20 MB parts and a small loader joins them in the browser. Joined, the parts are byte-identical to the release files. See `SHA256SUMS-engine.txt`.

## Where the source is

In the release of this repository (tag `v19.0.1`):

- `stockfish.js-19.0.1-source.tar.gz`: the Stockfish.js 19.0.1 source (Stockfish 19 as adapted for the browser, with the build scripts), the GitHub archive of tag v19.0.1 of https://github.com/nmrugg/stockfish.js
- `Stockfish-sf_19-source.tar.gz`: the original Stockfish 19 source, the GitHub archive of tag sf_19 of https://github.com/official-stockfish/Stockfish
- `nn-1a298aa575a0.nnue` and `nn-61e7af4bb97d.nnue`: the two networks, from Stockfish's data server (https://data.stockfishchess.org/nn/). Each file's name is the start of its SHA-256.

Checksums of these files are in `SHA256SUMS-source.txt`.

In this repository:

- `kibitz/engine.js`: the script that copies the engine files from the npm package `stockfish@19.0.1` and splits the Strong `.wasm` into parts.
- `kibitz/sf-full.js`: the template for the loader that joins the parts in the browser and starts the engine.

Both Kibitz files are released under GPL version 3 (see `LICENSE`).

## How to build the engine yourself

Kibitz didn't compile the engine; it uses the release files. To build them, follow the README in the Stockfish.js source: `node build.js`, with `--lite` for Standard and `--single-threaded` for the one-thread versions. The build downloads the network it needs (the files above are the same ones).

## Contact

Questions about this source: see the contact details in Kibitz under Terms of Use.
