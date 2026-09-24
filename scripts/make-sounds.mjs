/* Synthesises the board's sound effects into public/sounds/*.wav.
 *
 * The sounds are made here rather than downloaded: the familiar ones belong to
 * chess.com and Lichess, and are not ours to ship. What they share is easy to
 * describe — a wooden piece set down on a wooden board — so that is modelled
 * directly: a very short noise burst exciting a few damped resonances (the
 * piece), over a low, quickly-dying thump (the board). Chimes are struck-bell
 * partials, not melodies.
 *
 * Deterministic — the noise is seeded — so running it again reproduces the same
 * files byte for byte, and a change to a sound shows up as a change to this
 * file rather than an unexplained new binary.
 *
 *   node scripts/make-sounds.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RATE = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sounds");

// Mulberry32: small, seeded, good enough for noise.
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const buffer = (seconds) => new Float32Array(Math.ceil(seconds * RATE));

/* One piece meeting the board. `pitch` moves the resonances (a lighter, brighter
   knock is higher), `hard` shortens them and lifts the upper modes (a capture
   lands harder than a quiet move). */
function knock(out, at, { pitch = 1, hard = 0, gain = 1, seed = 1 }) {
  const rand = rng(seed);
  const start = Math.round(at * RATE);
  const modes = [
    // frequency, amplitude, decay (s)
    [640 * pitch, 1.0, 0.05 - hard * 0.015],
    [1480 * pitch, 0.55 + hard * 0.25, 0.032 - hard * 0.01],
    [2610 * pitch, 0.3 + hard * 0.25, 0.018],
    [4020 * pitch, 0.06 + hard * 0.2, 0.008],
  ];
  const phases = modes.map(() => rand() * Math.PI * 2);
  const length = Math.round(0.14 * RATE);
  /* The contact noise is low-passed, and more so for a quiet move: raw white
     noise reads as a click or a hiss, while wood sounds dull. One pole is
     enough — this shapes a 2 ms burst, not a signal anyone listens to alone. */
  const cutoff = 2400 + hard * 2200;
  const alpha = 1 - Math.exp((-2 * Math.PI * cutoff) / RATE);
  let lp = 0;
  for (let i = 0; i < length && start + i < out.length; i++) {
    const s = i / RATE;
    // Half a millisecond of attack, so the start is a knock and not a click.
    const attack = Math.min(1, s / 0.0005);
    let v = 0;
    modes.forEach(([f, a, d], k) => {
      v += a * Math.exp(-s / d) * Math.sin(2 * Math.PI * f * s + phases[k]);
    });
    // The board underneath: low, and gone almost at once.
    v += 0.55 * Math.exp(-s / 0.03) * Math.sin(2 * Math.PI * (150 * pitch) * s);
    // The contact itself: a 2 ms breath of noise.
    lp += alpha * ((rand() * 2 - 1) - lp);
    v += (1.4 + hard * 0.8) * Math.exp(-s / 0.0018) * lp;
    out[start + i] += gain * attack * v;
  }
}

/* A struck bell: inharmonic partials, each fading at its own rate. Soft on
   purpose — this is the end of a game, not an alarm. */
function bell(out, at, freq, { gain = 0.5, decay = 0.9 } = {}) {
  const start = Math.round(at * RATE);
  const partials = [
    [1, 1, decay],
    [2.76, 0.32, decay * 0.45],
    [5.4, 0.12, decay * 0.22],
  ];
  const length = Math.round(decay * 3 * RATE);
  for (let i = 0; i < length && start + i < out.length; i++) {
    const s = i / RATE;
    const attack = Math.min(1, s / 0.004);
    let v = 0;
    for (const [ratio, a, d] of partials) v += a * Math.exp(-s / d) * Math.sin(2 * Math.PI * freq * ratio * s);
    out[start + i] += gain * attack * v;
  }
}

/* A dull, low double tap — "not that one", without a buzzer. */
function thud(out, at, freq, { gain = 0.8 } = {}) {
  const start = Math.round(at * RATE);
  const length = Math.round(0.12 * RATE);
  for (let i = 0; i < length && start + i < out.length; i++) {
    const s = i / RATE;
    const attack = Math.min(1, s / 0.001);
    const v = Math.exp(-s / 0.035) * (Math.sin(2 * Math.PI * freq * s) + 0.4 * Math.sin(2 * Math.PI * freq * 2.1 * s));
    out[start + i] += gain * attack * v;
  }
}

const SOUNDS = {
  move: () => {
    const b = buffer(0.16);
    knock(b, 0, { seed: 11 });
    return b;
  },
  capture: () => {
    // Two contacts: the arriving piece, and the one it knocks off.
    const b = buffer(0.2);
    knock(b, 0, { pitch: 1.18, hard: 1, gain: 1, seed: 21 });
    knock(b, 0.024, { pitch: 1.05, hard: 0.6, gain: 0.55, seed: 22 });
    return b;
  },
  castle: () => {
    // King, then rook.
    const b = buffer(0.28);
    knock(b, 0, { seed: 31 });
    knock(b, 0.11, { pitch: 0.93, gain: 0.85, seed: 32 });
    return b;
  },
  check: () => {
    const b = buffer(0.45);
    knock(b, 0, { pitch: 1.1, hard: 0.7, seed: 41 });
    bell(b, 0.012, 1318.5, { gain: 0.18, decay: 0.13 });
    return b;
  },
  promote: () => {
    const b = buffer(0.6);
    knock(b, 0, { seed: 51 });
    bell(b, 0.06, 1046.5, { gain: 0.2, decay: 0.12 });
    bell(b, 0.14, 1568, { gain: 0.2, decay: 0.16 });
    return b;
  },
  "game-end": () => {
    const b = buffer(2.2);
    bell(b, 0, 784, { gain: 0.42, decay: 0.55 });
    bell(b, 0.16, 1046.5, { gain: 0.42, decay: 0.7 });
    return b;
  },
  wrong: () => {
    const b = buffer(0.3);
    thud(b, 0, 196);
    thud(b, 0.11, 165, { gain: 0.65 });
    return b;
  },
};

/* Peak-normalised to about -3 dBFS so every sound sits at the same loudness
   ceiling and none clips, then written as 16-bit mono PCM — the one format
   every browser decodes. */
function wav(samples) {
  let peak = 0;
  for (const v of samples) peak = Math.max(peak, Math.abs(v));
  const scale = peak > 0 ? 0.707 / peak : 0;
  // Fade the last 10 ms, so a tail cut by the buffer end does not click.
  const fade = Math.round(0.01 * RATE);
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => {
    const tail = Math.min(1, (samples.length - 1 - i) / fade);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * scale * tail)) * 32767), i * 2);
  });
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

mkdirSync(OUT, { recursive: true });
for (const [name, make] of Object.entries(SOUNDS)) {
  const file = wav(make());
  writeFileSync(join(OUT, `${name}.wav`), file);
  console.log(`${name}.wav`.padEnd(16), `${(file.length / 1024).toFixed(1)} KB`);
}
