import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata = { title: "JTrax — Reset password" };

/* The token arrives as a query param from the emailed link. Read here on the
   server and passed down, rather than with useSearchParams, which would opt
   the whole route out of server rendering. */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordScreen token={token ?? ""} />;
}

function ResetPasswordScreen({ token }: { token: string }) {
  const t = useTranslations("reset");
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <LanguageToggle className="absolute right-4 top-4" />
      <h1 className="text-4xl font-extrabold tracking-tight text-navy">JTrax</h1>
      <p className="mt-2 text-center text-sm text-muted">{t("setTitle")}</p>
      <ResetPasswordForm token={token} />
    </main>
  );
}
