"use client";

/* The speaker in the corner of every board screen: sound on or off, for this
   device. Says what pressing it will do, since the icon alone only says what
   is happening now. */
import { useTranslations } from "next-intl";
import { Volume2, VolumeX } from "lucide-react";
import { setSoundOn, useSoundOn } from "@/lib/sound";

export function SoundToggle({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  const on = useSoundOn();
  const label = on ? t("soundOff") : t("soundOn");
  return (
    <button
      type="button"
      onClick={() => setSoundOn(!on)}
      aria-label={label}
      title={label}
      aria-pressed={on}
      className={`flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#dce8f8] bg-white text-[#60779c] shadow-sm ${className}`}
    >
      {on ? <Volume2 className="size-[18px]" strokeWidth={2.4} /> : <VolumeX className="size-[18px]" strokeWidth={2.4} />}
    </button>
  );
}
