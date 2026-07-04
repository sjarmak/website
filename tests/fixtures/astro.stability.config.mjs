// Config wrapper for isolated-outDir test builds (register-stability.test.mjs
// and digest-noindex-lever.test.mjs): the real site config with only outDir
// overridden (from env), so test builds land in isolated directories and
// never clobber dist/.
import baseConfig from "../../astro.config.mjs";

const outDir = process.env.STABILITY_OUT_DIR;
if (!outDir) throw new Error("STABILITY_OUT_DIR must be set (test build harness only)");

export default { ...baseConfig, outDir };
