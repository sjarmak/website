import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { BUILD_MARKER } from "./build-marker.mjs";

const DEFAULT_BUILD = ["npm", "run", "build"];
const [command, ...args] = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_BUILD;
const marker = path.resolve("dist", BUILD_MARKER);

if (existsSync(marker)) {
  console.log(`[ensure-built] dist/${BUILD_MARKER} present; reusing the completed build`);
  process.exit(0);
}

console.log(`[ensure-built] no dist/${BUILD_MARKER}; running ${[command, ...args].join(" ")}`);
const result = spawnSync(command, args, { stdio: "inherit" });
if (result.error) throw result.error;
if (result.status !== 0) {
  const how = result.signal ? `signal ${result.signal}` : `exit ${result.status}`;
  console.error(`[ensure-built] build failed (${how}); dist/ is not marked complete`);
  process.exit(1);
}
await writeFile(marker, `${new Date().toISOString()}\n`);
