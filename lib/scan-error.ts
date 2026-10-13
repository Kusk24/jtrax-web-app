/**
 * Why an ID card scan failed, in words the person at the form can act on, with
 * the exact code a tester can pass on. Every failure used to read "the card
 * could not be read", whether the photo was blurry or the academy's scan key
 * had been refused.
 */
import { ScanError } from "./registration";

/** The reason codes the server sends, each with a sentence under register.scanWhy. */
export const SCAN_REASONS = [
  "model_unavailable",
  "key_rejected",
  "quota",
  "provider_error",
  "unreachable",
  "no_answer",
  "no_date_of_birth",
  "not_an_image",
  "too_large",
  "no_image",
  "not_configured",
] as const;

type Translate = (key: string, values?: Record<string, string | number>) => string;

/**
 * What the form shows for a failed scan: the reason in the reader's language,
 * then the code it came with — "quota 429", or "http 413" for a reply that
 * never came from the server.
 */
export function scanErrorText(err: unknown, t: Translate): string {
  if (!(err instanceof ScanError)) {
    // The request never got an answer: offline, or the page was left.
    const detail = err instanceof Error && err.message ? err.message : "network";
    return `${t("scanWhy.unsent")} (${t("scanErrorCode", { code: detail })})`;
  }
  const code = err.reason
    ? [err.reason, err.upstream || ""].join(" ").trim()
    : `http ${err.status}`;
  return `${scanSentence(err, t)} (${t("scanErrorCode", { code })})`;
}

function scanSentence(err: ScanError, t: Translate): string {
  if ((SCAN_REASONS as readonly string[]).includes(err.reason)) return t(`scanWhy.${err.reason}`);
  // No code: nginx or the proxy answered, not the scan.
  if (err.status === 413) return t("scanWhy.too_large");
  if (err.status === 429) return t("scanWhy.busy");
  // The server's own sentence, when it gave one without a code we know.
  return err.message || t("scanWhy.server");
}
