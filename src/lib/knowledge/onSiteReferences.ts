export interface OnSiteReference {
  collection: string;
  slug: string;
}

// Literature Explorers was removed as a public project in 7660dd1; keep this
// tombstone explicit so new unresolved on-site references still fail loudly.
export const REMOVED_ON_SITE_IDS = new Set<string>(["projects:lit-explorers"]);

export function onSiteReferenceId(ref: OnSiteReference): string {
  return `${ref.collection}:${ref.slug}`;
}

export function isActiveOnSiteReferenceId(id: string): boolean {
  return !REMOVED_ON_SITE_IDS.has(id);
}
