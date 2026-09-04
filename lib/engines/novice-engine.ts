/* The novice opponent: a 25.7M character-level GPT the academy trained from
   random weights on a million games between 800-1200 rated players.

   It does not know the rules. It reads the game so far as literal text —
   ";1.e4 e5 2.Nf3" — and predicts the next character, which is enough to
   produce a legal move about 94% of the time. The other 6% are retried here,
   because a model that proposes an illegal move is not resigning.

   It plays around 520 Elo. That is the point: it is the beginner's opponent,
   and a stronger one would be a worse one. */

import { Chess } from "chess.js";
import { ort, session, asset } from "./onnx";
import { promptFrom } from "./pgn-prompt";

/** Low, so we get its best guess rather than creative writing. Matches the
    temperature jtrax-ai/step3_probe.py measures the legal-move rate at, so the
    figure quoted for this model is the one it actually plays at. */
const TEMPERATURE = 0.5;
/** No legal SAN move is longer than this, including "Qxd8+" and "exd8=Q#". */
const MAX_MOVE_CHARS = 8;
/** Retries before giving up on the position. Six illegal proposals in a row is
    already vanishingly rare at 0.97 first-try legality. */
const MAX_RETRIES = 6;

type Vocab = { itos: string[]; stoi: Map<string, number>; blockSize: number };

let vocab: Promise<Vocab> | null = null;

function loadVocab(): Promise<Vocab> {
  vocab ??= asset<{ itos: string[]; block_size: number }>(
    "novice-vocab.json",
  ).then((v) => ({
    itos: v.itos,
    stoi: new Map(v.itos.map((c, i) => [c, i])),
    blockSize: v.block_size,
  }));
  return vocab;
}

export async function preload(): Promise<void> {
  await Promise.all([session("novice"), loadVocab()]);
}

function sample(logits: Float32Array, temperature: number): number {
  let max = -Infinity;
  for (const v of logits) if (v > max) max = v;
  // Subtract the max before exponentiating, or a large logit overflows to
  // Infinity and every probability becomes NaN.
  const weights = Array.from(logits, (v) => Math.exp((v - max) / temperature));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

/** Samples characters until the move ends, and returns it as SAN. */
async function nextMoveSan(prompt: string): Promise<string> {
  const [sess, v] = await Promise.all([session("novice"), loadVocab()]);

  // Characters outside the 32-symbol vocabulary cannot be represented at all,
  // so they are dropped rather than mapped to something arbitrary.
  let tokens = [...prompt]
    .map((c) => v.stoi.get(c))
    .filter((i): i is number => i !== undefined);

  let san = "";
  for (let i = 0; i < MAX_MOVE_CHARS; i += 1) {
    const window = tokens.slice(-v.blockSize);
    const out = await sess.run({
      tokens: new ort.Tensor(
        "int64",
        BigInt64Array.from(window, BigInt),
        [1, window.length],
      ),
    });
    const next = sample(out.logits.data as Float32Array, TEMPERATURE);
    const ch = v.itos[next];
    if (ch === " ") break;
    san += ch;
    tokens = [...tokens, next];
  }
  return san;
}

/** The move the novice plays, as UCI, or "" if it could not find a legal one
    after several tries — which is scored as a loss, the honest outcome. */
export async function bestMove(sanHistory: string[]): Promise<string> {
  const prompt = promptFrom(sanHistory);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const san = await nextMoveSan(prompt);
    if (!san) continue;
    // chess.js is the referee, not the model: it decides whether the proposed
    // text is a move that exists in this position.
    const board = new Chess();
    for (const past of sanHistory) board.move(past);
    try {
      const move = board.move(san);
      return move.from + move.to + (move.promotion ?? "");
    } catch {
      continue; // illegal or unparseable; ask again
    }
  }
  return "";
}
