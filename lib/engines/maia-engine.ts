/* The strong opponent: Maia-2, fine-tuned by the academy on 2000-2800 games.

   Maia-2 is rating-conditioned — the same weights play at any level you ask for
   via elos_self — so one 47 MB download covers every difficulty we might add.

   It is searchless: one forward pass ranks every legal move and the best is
   played. That is why it feels like a person rather than an engine, and why it
   answers in milliseconds. */

import { asset, ort, session } from "./onnx";
import { eloBucket, mirrorUci, prepare } from "./maia-encode";

const POLICY_SIZE = 1880;

type Vocab = { moves: string[]; index: Map<string, number> };

let vocab: Promise<Vocab> | null = null;

/** The move list and its reverse lookup, fetched once. The list order *is* the
    policy head's index space, which is why it is generated from the Python
    package rather than rebuilt here. */
function moveVocab(): Promise<Vocab> {
  vocab ??= asset<string[]>("maia-moves.json").then((moves) => ({
    moves,
    index: new Map(moves.map((m, i) => [m, i])),
  }));
  return vocab;
}

/** Warms the download so the first move is not the first wait. */
export async function preload(): Promise<void> {
  await Promise.all([session("strong"), moveVocab()]);
}

/** The move Maia plays in this position, as UCI on the real board.

    `elo` is the strength to imitate, not a cap: at 1100 it plays like a
    beginner on purpose, mistakes included. */
export async function bestMove(fen: string, elo: number): Promise<string> {
  const [sess, { moves, index }] = await Promise.all([
    session("strong"),
    moveVocab(),
  ]);
  const { board, legalIndices, mirrored } = prepare(fen, index);
  if (legalIndices.length === 0) return "";

  const bucket = BigInt(eloBucket(elo));
  const outputs = await sess.run({
    boards: new ort.Tensor("float32", board, [1, 18, 8, 8]),
    elos_self: new ort.Tensor("int64", BigInt64Array.from([bucket]), [1]),
    elos_oppo: new ort.Tensor("int64", BigInt64Array.from([bucket]), [1]),
  });

  const logits = outputs.logits_maia.data as Float32Array;
  if (logits.length !== POLICY_SIZE) {
    throw new Error(`policy head is ${logits.length}, expected ${POLICY_SIZE}`);
  }

  // Rank only legal moves, exactly as inference does in Python. Scoring the
  // full 1880 and hoping the top one is legal is how you ship illegal moves.
  let best = legalIndices[0];
  for (const i of legalIndices) if (logits[i] > logits[best]) best = i;

  const uci = moves[best];
  // The board was mirrored for the model whenever Black was to move, so the
  // answer comes back in that frame and has to be turned around again.
  return mirrored ? mirrorUci(uci) : uci;
}
