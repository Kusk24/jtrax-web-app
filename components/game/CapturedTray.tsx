"use client";

/* The pieces one side has taken, shown beside that player's name.
 *
 * Two things a beginner cannot easily see from the board alone: what has come
 * off, and whether they are ahead. Counting the gaps in a position is exactly
 * the skill they have not built yet — which is why every serious board shows
 * this, and why it belongs in a board for a chess school.
 *
 * The tray keeps its height whether or not anything has been captured, so the
 * board does not jump down the screen on the first exchange.
 */
import { pieceSrc } from "@/lib/chess-core";

export function CapturedTray({
  /** The side whose tray this is — it shows the pieces they have taken. */
  side,
  pieces,
  advantage,
}: {
  side: "w" | "b";
  pieces: string[];
  advantage: number;
}) {
  /* A white tray holds captured black pieces, and vice versa. */
  const glyphColour = side === "w" ? "b" : "w";
  const lead = side === "w" ? advantage : -advantage;

  return (
    <span className="flex min-h-[19px] items-center">
      {pieces.map((type, i) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={`${type}${i}`}
          src={pieceSrc(glyphColour, type)}
          alt=""
          draggable={false}
          style={{
            width: 17,
            height: 17,
            /* Runs of the same piece tuck together, so eight pawns still fit
               beside a name without shrinking them. */
            marginLeft: i > 0 && pieces[i - 1] === type ? -4 : i > 0 ? 1 : 0,
          }}
        />
      ))}
      {lead > 0 && (
        <span className="ml-1 text-[11.5px] font-bold tabular-nums text-sv-body">+{lead}</span>
      )}
    </span>
  );
}
