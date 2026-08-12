import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata = { title: "JTrax — Reset password" };

export default function ForgotPasswordPage() {
  const t = useTranslations("reset");
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <LanguageToggle className="absolute right-4 top-4" />
      <h1 className="text-4xl font-extrabold tracking-tight text-navy">JTrax</h1>
      <p className="mt-2 text-center text-sm text-muted">{t("requestTitle")}</p>
      <ForgotPasswordForm />
    </main>
  );
}
