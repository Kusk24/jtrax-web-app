"use client";

/* A password box with an eye that shows what was typed, so a password can be
   checked before it is sent — on sign-in, on reset and on change. It takes
   every prop an input does; only `type` is its own. */
import { useState, type InputHTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({ className = "", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const t = useTranslations("common");
  const [shown, setShown] = useState(false);
  return (
    <span className="relative flex">
      <input {...props} type={shown ? "text" : "password"} className={`${className} w-full pr-11`} />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={t(shown ? "hidePassword" : "showPassword")}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-navy"
      >
        {shown ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
      </button>
    </span>
  );
}
