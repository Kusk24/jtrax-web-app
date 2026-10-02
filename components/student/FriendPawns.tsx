/**
 * "Play with a friend": a white pawn and a black pawn side by side, the black
 * one leaning a little towards the white — two players, one game. Drawn with
 * the board's own piece art, so the black pawn is solid black. Used on Home's
 * tile and the Games card.
 */
import { pieceSrc } from "@/lib/chess-core";

export function FriendPawns({ size = "size-6" }: { size?: string }) {
  return (
    <span className="flex items-end" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG */}
      <img src={pieceSrc("w", "p")} alt="" className={size} draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG */}
      <img src={pieceSrc("b", "p")} alt="" className={`${size} -ml-2 origin-bottom -rotate-[14deg]`} draggable={false} />
    </span>
  );
}
