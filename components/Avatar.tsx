export function Avatar({
  name,
  colorClass,
  sizeClass = "size-12",
  textClass = "text-lg",
  badge = false,
}: {
  name: string;
  colorClass: string;
  sizeClass?: string;
  textClass?: string;
  badge?: boolean;
}) {
  return (
    <span className={`relative inline-flex shrink-0 ${sizeClass}`}>
      <span
        className={`flex size-full items-center justify-center rounded-full font-semibold ${colorClass} ${textClass}`}
      >
        {name.charAt(0)}
      </span>
      {badge && (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brick text-[10px] font-bold text-white ring-2 ring-cream">
          !
        </span>
      )}
    </span>
  );
}
