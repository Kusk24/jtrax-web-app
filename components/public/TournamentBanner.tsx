/* The banner across the top of a tournament — on the public registration page
 * and on the parent's tournament card.
 *
 * The organiser may upload their own poster art; most events never have any,
 * so without it the banner is drawn from the tournament itself: the school's
 * logo and name, the event's name, when and where. Every event gets its own
 * that way, and a long name still has room, because the text sits on the left
 * two-thirds and the chess decoration stays faint on the right.
 *
 * Sized by its own box, not the viewport (the `cqh` units below), so the
 * same banner reads the same at the top of a desktop page, in a phone-width
 * card, and inside the console's review frame. The console draws the same
 * design in its own component — keep the two in step.
 */
import { CalendarDays, MapPin } from "lucide-react";

/* 3:1, never taller than 223px, whatever the picture is: an upload is cropped
   to the box (cover), not allowed to push the form down. A caller that sets
   its own height (the parent's cards) overrides the ratio. */
const BOX: React.CSSProperties = { aspectRatio: "3 / 1", maxHeight: 223 };

export function TournamentBanner({
  name,
  when,
  venue,
  imageUrl,
  className = "",
}: {
  name: string;
  /** Already formatted for the reader's locale. */
  when?: string;
  venue?: string;
  /** The organiser's own banner, when there is one. */
  imageUrl?: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-pp-navy ${className}`} style={BOX}>
        {/* eslint-disable-next-line @next/next/no-img-element -- served by the API, sized by the box */}
        <img src={imageUrl} alt={name} className="absolute inset-0 size-full object-cover" />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={[name, when, venue].filter(Boolean).join(" · ")}
      className={`relative overflow-hidden text-white ${className}`}
      style={{
        ...BOX,
        /* Sized by the box's height (cqh), which is capped, so the text never
           outgrows a banner that stopped growing at 223px. */
        containerType: "size",
        background: "linear-gradient(118deg, #0f2350 0%, #1b3c85 52%, #2e5cb8 100%)",
      }}
    >
      {/* A board in the right half, fading out before it reaches the words. */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-[62%]"
        style={{
          backgroundImage: "repeating-conic-gradient(rgba(255,255,255,.075) 0% 25%, transparent 0% 50%)",
          backgroundSize: "12cqh 12cqh",
          maskImage: "linear-gradient(to left, #000 15%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to left, #000 15%, transparent 95%)",
        }}
      />
      {/* Light from the top right, so the blue is not flat. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 55% 90% at 88% 0%, rgba(133,170,238,.35), transparent 70%)" }}
      />
      {/* eslint-disable @next/next/no-img-element -- decoration, fixed files */}
      <img
        aria-hidden
        alt=""
        src="/pieces/ln.svg"
        className="absolute"
        style={{ right: "3cqw", bottom: "-16cqh", height: "112cqh", opacity: 0.16, filter: "brightness(0) invert(1)" }}
      />
      <img
        aria-hidden
        alt=""
        src="/pieces/lk.svg"
        className="absolute"
        style={{ right: "calc(3cqw + 70cqh)", bottom: "-10cqh", height: "58cqh", opacity: 0.08, filter: "brightness(0) invert(1)" }}
      />
      {/* eslint-enable @next/next/no-img-element */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[3px]"
        style={{ background: "linear-gradient(90deg, rgba(255,255,255,.55), rgba(255,255,255,0) 70%)" }}
      />

      <div
        className="relative flex h-full flex-col justify-center"
        style={{ padding: "8cqh 5cqw", gap: "4.5cqh", maxWidth: "72%" }}
      >
        <div className="flex items-center" style={{ gap: "4cqh" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a fixed file */}
          <img
            src="/jca-logo.png"
            alt=""
            aria-hidden
            className="shrink-0 rounded-full bg-white"
            style={{ width: "max(20px, 16cqh)", height: "max(20px, 16cqh)", boxShadow: "0 2px 8px rgba(0,0,0,.25)" }}
          />
          <span
            className="font-bold uppercase"
            style={{ fontSize: "max(8px, 4.4cqh)", letterSpacing: ".22em", opacity: 0.9 }}
          >
            JCA Chess School
          </span>
        </div>
        <p
          className="font-pp-display font-bold"
          style={{
            margin: 0,
            fontSize: "max(14px, 12cqh)",
            lineHeight: 1.12,
            letterSpacing: "-0.01em",
            textWrap: "balance",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textShadow: "0 2px 12px rgba(0,0,0,.18)",
          }}
        >
          {name}
        </p>
        {(when || venue) && (
          <div className="flex flex-wrap items-center" style={{ gap: "1.5cqh 6cqh", fontSize: "max(10px, 5.2cqh)" }}>
            {when && (
              <span className="inline-flex items-center font-semibold" style={{ gap: "2cqh" }}>
                <CalendarDays aria-hidden style={{ width: "1.15em", height: "1.15em", opacity: 0.85 }} />
                {when}
              </span>
            )}
            {venue && (
              <span className="inline-flex min-w-0 items-center font-semibold" style={{ gap: "2cqh" }}>
                <MapPin aria-hidden className="shrink-0" style={{ width: "1.15em", height: "1.15em", opacity: 0.85 }} />
                <span className="truncate">{venue}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
