import { spawnSync } from "node:child_process";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const HAS_FFMPEG = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;

export async function fakeKokoroVenv(root) {
  const venvBin = path.join(root, "venv", "bin");
  await mkdir(venvBin, { recursive: true });
  const python = path.join(venvBin, "python");
  await writeFile(
    python,
    [
      "#!/usr/bin/env bash",
      "set -euo pipefail",
      'dir="$3"',
      'for chunk in "$dir"/chunk-*.txt; do',
      '  n="${chunk##*/chunk-}"; n="${n%.txt}"',
      '  ffmpeg -loglevel error -f lavfi -i anullsrc=r=24000:cl=mono -t 1 "$dir/part-$n.wav"',
      "done",
      "",
    ].join("\n"),
  );
  await chmod(python, 0o755);
  return path.join(root, "venv");
}
