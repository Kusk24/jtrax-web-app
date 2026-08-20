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
import { PIECE_GLYPH } from "@/lib/chess-core";

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
        <span
          key={`${type}${i}`}
          aria-hidden
          className="leading-none"
          style={{
            fontSize: 17,
            /* The board's own piece colours, so a captured knight looks like
               the knight it was. */
            color: glyphColour === "w" ? "var(--color-sv-piece-white)" : "var(--color-sv-piece-black)",
            /* On the board a white piece always has a square behind it. Here it
               sits on the white panel, so it needs its own edge — without this the white
               half of the tray is very nearly invisible, which is exactly how
               the first attempt came out. */
            WebkitTextStroke: glyphColour === "w" ? "0.7px rgb(36,65,124)" : undefined,
            /* Runs of the same piece tuck together, so eight pawns still fit
               beside a name without shrinking the glyphs. */
            marginLeft: i > 0 && pieces[i - 1] === type ? -4 : i > 0 ? 1 : 0,
          }}
        >
          {/* Always the filled silhouette, for both colours. The outline glyphs
              Unicode gives White are mostly whitespace at 17px and disappear
              into the panel; a solid shape tinted ivory reads at a glance. */}
          {PIECE_GLYPH["b" + type]}
        </span>
      ))}
      {lead > 0 && (
        <span className="ml-1 text-[11.5px] font-bold tabular-nums text-sv-body">+{lead}</span>
      )}
    </span>
  );
}
