/* Puts the two ONNX models and onnxruntime's WASM into public/models/.

   None of it is in git: the weights are 73 MB and the runtime binaries are a
   dependency artefact, so both are reproducible rather than committed. Run this
   after a fresh clone, and after retraining.

   Weights come from the jtrax-ai checkout next door by default. A deployment
   that cannot reach it should host them and set NEXT_PUBLIC_MODEL_BASE_URL
   instead — nothing in the app assumes they are served from this origin. */
import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const models = join(app, "public", "models");
const ai = process.env.JTRAX_AI_DIR ?? join(app, "..", "jtrax-ai");

const WEIGHTS = ["novice_int8.onnx", "strong_fp16.onnx"];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

await mkdir(join(models, "ort"), { recursive: true });

// The runtime fetches these itself at load time; lib/engines/onnx.ts points it
// here with ort.env.wasm.wasmPaths.
const dist = join(app, "node_modules", "onnxruntime-web", "dist");
let copied = 0;
for (const file of await readdir(dist)) {
  if (file.endsWith(".wasm") || file.endsWith(".mjs")) {
    await cp(join(dist, file), join(models, "ort", file));
    copied += 1;
  }
}
console.log(`  onnxruntime  ${copied} files -> public/models/ort/`);

let missing = 0;
for (const file of WEIGHTS) {
  const from = join(ai, "results", file);
  if (!(await exists(from))) {
    console.log(`  MISSING      ${file}  (looked in ${from})`);
    missing += 1;
    continue;
  }
  await cp(from, join(models, file));
  const { size } = await stat(join(models, file));
  console.log(`  ${file.padEnd(20)} ${(size / 1e6).toFixed(1)} MB`);
}

if (missing) {
  console.log(
    `\n${missing} model(s) missing. Regenerate them in jtrax-ai:\n` +
      "  conda activate jtrax-ai\n" +
      "  python step9_export_novice_onnx.py\n" +
      "  python step10_export_strong_onnx.py",
  );
  process.exit(1);
}
console.log("\nReady. The Play screen can serve all three opponents.");
