import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BUILD_MARKER } from "../../scripts/test/build-marker.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const MARKER = path.join(REPO_ROOT, "dist", BUILD_MARKER);

export function requireDist() {
  if (!existsSync(MARKER)) {
    throw new Error(
      `dist/ has no completed build: dist/${BUILD_MARKER} is missing. ` +
        "Run npm test, which builds first, or run node scripts/test/ensure-built.mjs before node --test.",
    );
  }
}
