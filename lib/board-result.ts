/* Reading a board's result on the public results page. */

/** White's score from the result as either source prints it: the console's
    "1-0", "1/2-1/2", "+/-", or chess-results' "1 - 0", "½ - ½", "+ - -".
    Null when there is no result yet, or one this page does not recognise. */
export function whiteScore(result: string): number | null {
  const r = result.replace(/\s+/g, "").replaceAll("1/2", "½");
  if (/^(1|\+)[^0-9½+]*-(0|-)$/.test(r) || r === "+/-" || r === "+--") return 1;
  if (/^(0|-)[^0-9½+]*-(1|\+)$/.test(r) || r === "-/+" || r === "--+") return 0;
  if (/^½-½/.test(r)) return 0.5;
  return null;
}
