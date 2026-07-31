import path from "node:path";

export function requireMediaRoot(environment = process.env) {
  const configured = environment.WEBSITE_MEDIA_ROOT;
  if (!configured) {
    throw new Error(
      "WEBSITE_MEDIA_ROOT must point to the media worktree's public/media directory",
    );
  }
  if (!path.isAbsolute(configured)) {
    throw new Error("WEBSITE_MEDIA_ROOT must be an absolute path");
  }
  return path.resolve(configured);
}

export function digestAudioPath(slug, environment = process.env) {
  return path.join(requireMediaRoot(environment), "digests", `${slug}.mp3`);
}
