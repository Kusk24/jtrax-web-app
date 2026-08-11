import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LoginForm } from "@/components/LoginForm";
import { SESSION_COOKIE, fetchMe, homeFor } from "@/lib/session";

function Landing({ noPortal }: { noPortal?: boolean }) {
  const t = useTranslations("landing");
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <LanguageToggle className="absolute right-4 top-4" />
      <h1 className="text-4xl font-extrabold tracking-tight text-navy">JTrax</h1>
      <p className="mt-2 text-center text-sm text-muted">{t("tagline")}</p>
      {noPortal && (
        <p className="mt-4 max-w-sm text-center text-xs font-bold text-brick">{t("noPortal")}</p>
      )}
      <LoginForm />
    </main>
  );
}

export default async function SignInPage() {
  const store = await cookies();
  const me = await fetchMe(store.get(SESSION_COOKIE)?.value);
  const home = me ? homeFor(me.role) : null;
  if (home) redirect(home);
  return <Landing noPortal={!!me} />;
}
