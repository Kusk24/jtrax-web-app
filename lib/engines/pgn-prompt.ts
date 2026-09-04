/* The exact text format the novice model was trained on.

   Its own module so it can be tested without pulling in onnxruntime — and
   because getting the move numbering wrong shifts every position the model
   sees by one, which it would answer plausibly and badly. */

/** ";1.e4 e5 2.Nf3 " — the leading ';' is the game delimiter the model saw
    between games in training, and output degrades noticeably without it. */
export function promptFrom(sanHistory: string[]): string {
  let out = ";1.";
  sanHistory.forEach((san, i) => {
    out += san + " ";
    // A move number is written after Black's move, ready for the next pair.
    // Math.floor, not i / 2: plain division writes "2.5." after Black's first.
    if (i % 2 === 1) out += `${Math.floor(i / 2) + 2}.`;
  });
  return out;
}
