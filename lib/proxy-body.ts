/**
 * How the same-origin proxy should forward a request body.
 *
 * Almost everything the portals send is JSON, and for a long time the proxy
 * assumed *everything* was: it set `Content-Type: application/json` on the way
 * out and read the body with `req.text()`.
 *
 * Then the tournament entry form started uploading a photo of an ID card.
 * Both halves of that assumption break a multipart upload, and they break it
 * silently:
 *
 *   - The outgoing content type replaced the incoming one, so the
 *     `boundary=...` parameter was gone. Without a boundary there is no way to
 *     find where the parts start, and the server cannot parse the form at all.
 *   - `req.text()` decodes bytes as UTF-8. A JPEG is not UTF-8, so every
 *     invalid sequence became U+FFFD — most of the file, replaced with
 *     question marks, before it ever left the proxy.
 *
 * What a parent saw was "image is too large (10 MB maximum)" against a 200 KB
 * photo, because the backend was reporting every parse failure as a size
 * failure. That has been separated too, but the cause was here.
 *
 * Kept in `lib/` rather than inline in the route so it can be tested: the
 * route imports `next/headers`, which needs a request context to call.
 */

export type ForwardPlan = {
  /** The content type to send upstream. */
  type: string;
  /** Read the body as text (true) or as raw bytes (false). Bytes are the safe
      answer for anything that is not certainly text, so this is only true for
      what we positively recognise as JSON. */
  asText: boolean;
};

/**
 * Decide from the incoming content type alone.
 *
 * An absent type is treated as JSON because that is what the portals' own
 * `fetch` calls send when they post nothing — a body-less POST, where there is
 * nothing to corrupt either way.
 *
 * Anything else is passed through **unchanged**, parameters included. That is
 * the whole point: `multipart/form-data; boundary=----WebKitFormBoundaryAbc`
 * has to arrive with that boundary intact or the upload is unreadable.
 */
export function forwardAs(contentType: string | null | undefined): ForwardPlan {
  const type = (contentType ?? "").trim();
  if (type === "") return { type: "application/json", asText: true };
  /* `includes` rather than equality: a browser may send
     `application/json; charset=utf-8`, which is still JSON. */
  if (type.toLowerCase().includes("application/json")) {
    return { type, asText: true };
  }
  return { type, asText: false };
}
