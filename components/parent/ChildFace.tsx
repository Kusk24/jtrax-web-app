/**
 * A child's face, or an honest stand-in.
 *
 * Only the two design-seed children have photos; everyone registered since
 * has `photo: ""`, and painting `url('')` over the tint rendered as a big
 * blank block — the "black profile" on the Children screen. No photo now
 * means a monogram on the same tint, which reads as a person rather than as
 * a broken image.
 */
export function ChildFace({
  name,
  photo,
  tint,
  className,
  initialClassName = "text-lg",
}: {
  name: string;
  photo: string;
  tint: string;
  /** Sizing and shape come from the call site — a 42px circle and a full-width
      card header are the same component with different clothes. */
  className: string;
  initialClassName?: string;
}) {
  if (photo) {
    return (
      <span
        aria-label={name}
        className={`bg-cover bg-center ${className}`}
        style={{ backgroundColor: tint, backgroundImage: `url('${photo}')` }}
      />
    );
  }
  return (
    <span
      aria-label={name}
      className={`flex items-center justify-center ${className}`}
      style={{ backgroundColor: tint }}
    >
      <span className={`font-pp-display font-semibold text-pp-deep ${initialClassName}`}>
        {(name.trim()[0] ?? "?").toUpperCase()}
      </span>
    </span>
  );
}
