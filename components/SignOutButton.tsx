"use client";

/* Sign-out control for the three portals. The signOut action clears the session
   cookie and revokes the backend token, so this has to be a real form post — the
   three portals look nothing alike, so only the pending behaviour lives here and
   the shape comes from className. */
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { signOut } from "@/app/actions/auth";

function Submit({ className, children }: { className?: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {children}
    </button>
  );
}

export function SignOutButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations("common");
  /* `contents` keeps the wrapper out of the way of the portal's own layout. */
  return (
    <form action={signOut} className="contents">
      <Submit className={className}>{children ?? t("signOut")}</Submit>
    </form>
  );
}
