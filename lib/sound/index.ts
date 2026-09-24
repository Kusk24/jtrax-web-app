/* The board's sound effects: which sound a move makes, playing it, and the
   switch that turns them off. Sources for the files are in
   scripts/make-sounds.mjs. */
export { ALL_SOUNDS, lastMoveOf, moveBetween, moveFrom, soundForMove, type SoundName } from "./kind";
export { playSound, preloadSounds } from "./player";
export { isSoundOn, setSoundOn, useSoundOn } from "./setting";
