/* A knockout bracket, drawn when the rounds actually form one.
 *
 * Chess tournaments are usually Swiss — everyone plays every round — and a
 * bracket would misrepresent those, so this renders only when the shape is
 * genuinely a knockout: each round's field is at most half the previous one,
 * and everyone playing was in the round before. Swiss events keep the honest
 * round-by-round list.
 *
 * Server-rendered, pure CSS. Columns are flexed with space-around so each
 * match sits at the vertical midpoint of the two feeding it, which is the
 * whole geometry of a bracket; the connecting stubs are borders, not images.
 */

type Board = { board: number; white: string; black?: string; result: string };
type Round = { round: number; status: string; pairings: Board[] };

/** The rounds as a knockout, or null when they are not one. */
export function knockoutRounds(rounds: Round[]): Round[] | null {
  const paired = rounds.filter((r) => r.pairings.length > 0);
  if (paired.length < 2) return null;
  for (let i = 1; i < paired.length; i++) {
    const prev = paired[i - 1];
    const cur = paired[i];
    // A Swiss round pairs the whole field again; a knockout halves it. This
    // one comparison is what keeps brackets off Swiss events.
    if (cur.pairings.length > Math.ceil(prev.pairings.length / 2)) return null;
    const before = new Set<string>();
    for (const p of prev.pairings) {
      before.add(p.white);
      if (p.black) before.add(p.black);
    }
    for (const p of cur.pairings) {
      if (!before.has(p.white) || (p.black && !before.has(p.black))) return null;
    }
  }
  return paired;
}

function winnerOf(b: Board): "w" | "b" | "" {
  if (!b.black) return "w"; // a bye advances
  if (b.result === "1-0" || b.result === "+/-") return "w";
  if (b.result === "0-1" || b.result === "-/+") return "b";
  return "";
}

function shortResult(r: string): string {
  if (r === "1/2-1/2") return "½–½";
  if (r === "Pending") return "";
  if (r === "bye") return "bye";
  return r;
}

function roundTitle(index: number, total: number): string {
  const fromEnd = total - index;
  if (fromEnd === 1) return "Final";
  if (fromEnd === 2) return "Semifinals";
  if (fromEnd === 3) return "Quarterfinals";
  return `Round ${index + 1}`;
}

function Match({ b }: { b: Board }) {
  const w = winnerOf(b);
  const row = (side: "w" | "b", name: string | undefined) => (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-1.5 text-[12.5px] ${
        w === side ? "font-extrabold text-navy" : w !== "" ? "text-muted" : "text-ink"
      }`}
    >
      <span className="min-w-0 truncate">{name ?? <span className="text-muted">bye</span>}</span>
      {w === side && (
        /* The advancing player gets a mark, not just boldness — bold alone is
           invisible to half the room on a projector. */
        <svg viewBox="0 0 24 24" className="size-3 shrink-0 fill-none stroke-brick" strokeWidth="3">
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
  return (
    <div className="relative">
      <div className="w-44 overflow-hidden rounded-xl border-2 border-line bg-card shadow-[0_2px_0_rgba(0,0,0,0.04)]">
        {row("w", b.white)}
        <div className="border-t border-line" />
        {row("b", b.black)}
      </div>
      {shortResult(b.result) && (
        <span className="absolute -top-2 right-2 rounded-full border border-line bg-cream px-1.5 font-mono text-[10px] font-bold text-muted">
          {shortResult(b.result)}
        </span>
      )}
    </div>
  );
}

export function Bracket({ rounds }: { rounds: Round[] }) {
  const total = rounds.length;
  const final = rounds[total - 1];
  const champion =
    final.pairings.length === 1 && winnerOf(final.pairings[0]) !== ""
      ? winnerOf(final.pairings[0]) === "w"
        ? final.pairings[0].white
        : final.pairings[0].black
      : null;

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-line bg-card">
      <h2 className="border-b-2 border-line px-4 py-3 text-sm font-bold text-ink">Bracket</h2>

      {/* A bracket is wide by nature; on a phone it scrolls sideways inside
          this box rather than stretching the page. */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-stretch gap-0 px-4 py-6">
          {rounds.map((round, i) => (
            <div key={round.round} className="flex">
              <div className="flex flex-col">
                <p className="pb-3 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                  {roundTitle(i, total)}
                </p>
                <div className="flex flex-1 flex-col justify-around gap-4">
                  {round.pairings.map((b) => (
                    <Match key={b.board} b={b} />
                  ))}
                </div>
              </div>
              {/* The connector column: one stub per match at its midpoint.
                  space-around on both sides keeps feeder and fed aligned. */}
              {i < total - 1 && (
                <div className="mt-7 flex w-6 flex-col justify-around">
                  {round.pairings.map((b) => (
                    <div key={b.board} className="h-0 border-t-2 border-line" />
                  ))}
                </div>
              )}
            </div>
          ))}

          {champion && (
            <div className="mt-7 flex flex-col justify-around pl-4">
              <div className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-peach-ink/40 bg-cream px-4 py-3">
                {/* Inline SVG trophy — house rule: no emoji as UI icons. */}
                <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-brick" strokeWidth="2">
                  <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Champion</span>
                <span className="text-sm font-extrabold text-navy">{champion}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
