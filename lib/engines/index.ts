/* The two chess models the academy trained, served in the browser.

   Import sites stay stable through this barrel: which file a model lives in,
   and whether it is quantised, is not their concern. */
export { MODEL_BASE, MODEL_FILES, type ModelName } from "./onnx";
export * as maia from "./maia-engine";
export * as novice from "./novice-engine";
export { promptFrom } from "./pgn-prompt";
