# Media deployment boundary

## Decision

Large audio and video files are deployed from the `media` branch through the
`sjarmak-ai-media` Render static service. The main site rewrites `/media/*` to
that service, so published URLs do not change.

The main branch does not contain `public/media`. Content publishing writes
media through a dedicated worktree on the `media` branch and writes page
content through the main worktree.

## Why

The Astro build itself takes seconds. The dominant deployment cost was
checking out roughly 2.5 GB of versioned media before every site build. Media
changes much less often than pages and application code, so the two release
cadences should not share one checkout.

## Invariants

- Existing `/media/...` URLs remain stable.
- The media branch is created and deployed before media is removed from main.
- A representative MP4 and MP3 must return the correct content type from the
  media service before the main copy is removed.
- New publishing automation must never stage `public/media` on main.
- The media branch remains the recovery copy for the archive.

## Tradeoff

The site now has two static services and a cross-service rewrite. In exchange,
ordinary deploys no longer transfer or copy the media archive. A future object
store and CDN could replace the media service without changing public URLs.
