/* Playing the board's sounds, through Web Audio.
 *
 * Web Audio rather than an <audio> element per sound: a capture right after the
 * opponent's move has to overlap it, not wait for it, and an element restarted
 * mid-play clips. The files are fetched ahead of time as bytes, but only decoded
 * on first use — decoding needs an AudioContext, and a context created before
 * the player has touched the page starts suspended and warns in the console.
 * The first sound always follows a click or tap, so that is where it is made. */
import { ALL_SOUNDS, type SoundName } from "./kind";
import { soundAllowed } from "./setting";

/* Below full scale: these sit under the game, not over it. */
const VOLUME = 0.7;

const bytes = new Map<SoundName, Promise<ArrayBuffer>>();
const decoded = new Map<SoundName, Promise<AudioBuffer>>();
let context: AudioContext | null = null;

function fetchBytes(name: SoundName): Promise<ArrayBuffer> {
  let pending = bytes.get(name);
  if (!pending) {
    pending = fetch(`/sounds/${name}.wav`).then((r) => {
      if (!r.ok) throw new Error(`sound ${name}: ${r.status}`);
      return r.arrayBuffer();
    });
    // A failed fetch is forgotten, so the next play tries again.
    pending.catch(() => bytes.delete(name));
    bytes.set(name, pending);
  }
  return pending;
}

/** Starts downloading the sounds, so the first move is not the one that waits
    for them. Around 360 KB in all, fetched only where a board is shown. */
export function preloadSounds(names: readonly SoundName[] = ALL_SOUNDS) {
  if (typeof window === "undefined") return;
  for (const name of names) void fetchBytes(name).catch(() => {});
}

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

/** Plays one sound, if sound is on. Never throws and never waits: a board that
    cannot make a noise still has to move. */
export function playSound(name: SoundName) {
  if (typeof window === "undefined" || !soundAllowed()) return;
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});

  let buffer = decoded.get(name);
  if (!buffer) {
    // decodeAudioData takes ownership of the bytes, so it gets a copy.
    buffer = fetchBytes(name).then((b) => ctx.decodeAudioData(b.slice(0)));
    buffer.catch(() => decoded.delete(name));
    decoded.set(name, buffer);
  }
  void buffer
    .then((b) => {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = VOLUME;
      source.buffer = b;
      source.connect(gain).connect(ctx.destination);
      source.start();
    })
    .catch(() => {});
}
