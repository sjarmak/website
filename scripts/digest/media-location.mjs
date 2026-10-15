import path from "node:path";

import { mediaBackend, spoolRoot } from "../media/config.mjs";
import { assertMediaKey } from "../media/keys.mjs";

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

export function mediaFilesRoot(environment = process.env) {
  return mediaBackend(environment) === "r2" ? spoolRoot(environment) : requireMediaRoot(environment);
}

export function localMediaPath(key, environment = process.env) {
  return path.join(mediaFilesRoot(environment), assertMediaKey(key));
}
