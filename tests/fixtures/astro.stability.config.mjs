// Config wrapper for tests/register-stability.test.mjs: the real site config
// with only outDir overridden (from env), so double builds land in isolated
// directories and never clobber dist/.
import baseConfig from "../../astro.config.mjs";

const outDir = process.env.STABILITY_OUT_DIR;
if (!outDir) throw new Error("STABILITY_OUT_DIR must be set (stability test harness only)");

export default { ...baseConfig, outDir };
