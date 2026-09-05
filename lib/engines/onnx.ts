/* Loading our two ONNX models in the browser, once each.

   Both models run client-side next to the Stockfish worker: nothing is served
   from the API, so there is no inference bill and a game still works offline
   once the weights are cached.

   They are large — 26 MB and 47 MB — so a session is created lazily and then
   kept. A student who only ever plays Stockfish downloads neither. */

import * as ort from "onnxruntime-web";

/** Where the weights live. Defaults to the app's own /models, but the files are
    gitignored, so a deployment may point this at object storage instead of
    carrying 73 MB of binaries in the repository. */
export const MODEL_BASE =
  process.env.NEXT_PUBLIC_MODEL_BASE_URL?.replace(/\/$/, "") ?? "/models";

export const MODEL_FILES = {
  novice: "novice_int8.onnx",
  strong: "strong_fp16.onnx",
} as const;

export type ModelName = keyof typeof MODEL_FILES;

let configured = false;

function configure() {
  if (configured) return;
  // The runtime fetches its own .wasm at load time; without this it looks for
  // them beside the JS bundle, where Next.js has not put them.
  ort.env.wasm.wasmPaths = `${MODEL_BASE}/ort/`;
  // One thread. Multi-threading needs cross-origin isolation headers we do not
  // set, and silently falls back anyway — better to be explicit than to wonder.
  ort.env.wasm.numThreads = 1;
  ort.env.logLevel = "error";
  configured = true;
}

const sessions = new Map<ModelName, Promise<ort.InferenceSession>>();

/** The session for a model, created on first use and shared after. Rejections
    are not cached, so a failed download can be retried by asking again. */
export function session(name: ModelName): Promise<ort.InferenceSession> {
  const existing = sessions.get(name);
  if (existing) return existing;

  configure();
  const created = ort.InferenceSession.create(
    `${MODEL_BASE}/${MODEL_FILES[name]}`,
    { executionProviders: ["wasm"], graphOptimizationLevel: "all" },
  ).catch((err) => {
    sessions.delete(name);
    throw err;
  });
  sessions.set(name, created);
  return created;
}

/** Fetches a small JSON asset from the same place as the models. */
export async function asset<T>(file: string): Promise<T> {
  const res = await fetch(`${MODEL_BASE}/${file}`);
  if (!res.ok) throw new Error(`${file}: ${res.status}`);
  return (await res.json()) as T;
}

export { ort };
