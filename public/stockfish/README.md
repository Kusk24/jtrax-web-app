# Stockfish 18 (lite, single-threaded)

Stockfish runs as a Web Worker. Once the worker and engine assets have loaded, the browser calculates moves locally.

## Which build and why

`stockfish-18-lite-single` — 7.3 MB, one thread.

The multi-threaded builds need `SharedArrayBuffer`, which needs cross-origin
isolation (`COOP`/`COEP`) on every response. Turning that on would break Google
Fonts and any other cross-origin asset in the app, to make an engine that is
already far stronger than any pupil slightly stronger still. The full (non-lite)
builds carry a 113 MB network, which is not a thing to send to a phone.

Strength is limited through UCI anyway — see `components/game/useStockfish.ts`.

## Licence

Stockfish is **GPL-3.0**. `Copying.txt` is its licence text, shipped alongside
as the licence requires.

The files here are **unmodified** upstream artefacts, taken from the `stockfish`
npm package (18.0.8) which builds them from the official source:

- Source: <https://github.com/official-stockfish/Stockfish>
- npm package: <https://www.npmjs.com/package/stockfish>

Do not edit them. If they need updating, replace them from the package again and
record the version here.
