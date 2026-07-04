# Runbook: private vault content leaked to the public repo or site

Procedure for the case where Obsidian-vault-derived content (private notes,
names, critiques, drafts under `~/brain`) reaches `sjarmak/website` on GitHub
or the built site at `https://www.sjarmak.ai`.

Work the sections in order. Section 1 stops the bleeding; sections 2–3 chase
copies; section 4 governs what we say about it.

**Leak surface checklist** (sweep all of these, not just `src/content/`):

- [ ] git history on `origin` (`main` + all branches + tags)
- [ ] **beads sync ref `refs/dolt/data` on the same remote** — issue titles,
      descriptions, and `bd remember` notes are pushed there and are fetchable
      by anyone with repo read access, even though it is not a branch
- [ ] the live site (`https://www.sjarmak.ai`), including `/llms.txt` and
      `/llms-full.txt`, which aggregate content-collection text into single
      crawler-friendly files
- [ ] `dist/` artifacts on Render and the GitHub Actions run logs/artifacts
- [ ] open/closed PR diffs and issue comments on GitHub
- [ ] `transcripts/` and `architecture/` in the repo (agent output can quote
      vault text verbatim)

---

## 1. Remove it: git history rewrite

### 1.0 Freeze writers first

The digest cron auto-commits and pushes to `main` daily. A push during the
rewrite recreates the old history.

```bash
# find and stop the cron entry that runs scripts/digest/run.sh
crontab -l | grep -n digest
crontab -e   # comment it out until the rewrite is done

# make sure no beads sync fires mid-rewrite
bd sync --status 2>/dev/null || true
```

### 1.1 Locate every commit that touches the leak

```bash
# by path
git log --all --full-history --oneline -- 'src/content/**/<leaked-file>*'

# by content (catches renames and partial quotes)
git log --all -S '<distinctive leaked phrase>' --oneline
git grep -I '<distinctive leaked phrase>' $(git rev-list --all) 2>/dev/null | cut -d: -f1 | sort -u
```

### 1.2 Rewrite with git-filter-repo

`git filter-repo` refuses to run in a dirty or non-fresh clone; work in a
throwaway mirror clone, never the working checkout.

```bash
pipx install git-filter-repo   # or: pip install git-filter-repo

cd /tmp
git clone --mirror https://github.com/sjarmak/website.git website-rewrite.git
cd website-rewrite.git

# Case A: whole file(s) must vanish from history
git filter-repo --invert-paths \
  --path src/content/posts/<leaked-file>.md \
  --path public/<leaked-asset>.png

# Case B: strings inside surviving files (names, phrases)
cat > /tmp/expressions.txt <<'EOF'
literal:Firstname Lastname==>[name removed]
literal:<distinctive leaked phrase>==>[removed]
EOF
git filter-repo --replace-text /tmp/expressions.txt

# verify the leak is gone from ALL history before pushing anything
git log --all -S '<distinctive leaked phrase>' --oneline   # must print nothing
```

### 1.3 Sweep the beads ref (refs/dolt/data)

`git filter-repo` only rewrites branches/tags. The beads Dolt data rides on
`refs/dolt/data` and must be handled separately.

```bash
# does the leak exist in bead data?
bd list --json | grep -i '<distinctive leaked phrase>'
dolt --data-dir ~/.beads/dolt sql -q "select * from issues where description like '%<phrase>%'" 2>/dev/null

# if yes: fix the rows locally (bd update / bd close --reason, edit text),
# then destroy the remote ref and re-push clean data
git push origin :refs/dolt/data
bd sync            # re-pushes refs/dolt/data from the cleaned local DB
```

If the leak was in the ref but not the local DB (e.g. from another machine),
delete the ref first, reconcile locally, then sync.

### 1.4 Force-push and coordinate

```bash
cd /tmp/website-rewrite.git
# temporarily lift branch protection on main if it blocks force-push:
# https://github.com/sjarmak/website/settings/branches
git push --force --mirror https://github.com/sjarmak/website.git
```

Then invalidate every downstream copy of the old history:

- **Local clones (all machines + active worktrees):** do not `git pull`
  (it merges old history back). Re-clone, or hard-reset each:
  ```bash
  git fetch origin && git reset --hard origin/main
  git reflog expire --expire=now --all && git gc --prune=now --aggressive
  ```
- **Forks:** `gh api repos/sjarmak/website/forks --jq '.[].full_name'` — for
  each fork, ask the owner to delete or rebase it; GitHub Support can detach
  or remove forks you cannot reach.
- **Stashes / worktrees under `.claude/worktrees/`:** delete and recreate;
  they pin old commits.

### 1.5 Purge GitHub-side caches (Support required)

Force-pushing does **not** delete old commits from GitHub. They remain
reachable by SHA (`https://github.com/sjarmak/website/commit/<old-sha>`), in
cached PR diffs, and in the Events API until GitHub runs a server-side gc.

1. Open a ticket: <https://support.github.com/request> → "Remove cached data /
   sensitive data removal". Reference their doc:
   <https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository>
2. Give them the exact old commit SHAs (from step 1.1) and any PR numbers
   whose diffs render the leaked content, and ask for:
   - server-side gc of the dangling commits
   - purge of cached views/diffs for the listed PRs
   - removal of the leaked content from code search indexing
3. Check Actions artifacts and logs:
   `gh run list --limit 50` → for any run whose logs quote the content:
   `gh api -X DELETE /repos/sjarmak/website/actions/runs/<run-id>/logs`

### 1.6 Redeploy the site on Render

Render serves the last built `dist/`; it keeps serving leaked pages until a
new deploy replaces them. `docs/**` pushes do not trigger builds
(`buildFilter` in `render.yaml`), and CI must pass before auto-deploy, so do
not rely on the rewrite push alone:

```bash
# option 1: dashboard — https://dashboard.render.com → sjarmak-ai
#           → Manual Deploy → "Clear build cache & deploy"

# option 2: API
curl -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clearCache": "clear"}'
```

Then verify on the live site:

```bash
curl -s https://www.sjarmak.ai/llms-full.txt | grep -i '<distinctive leaked phrase>'  # must be empty
curl -s https://www.sjarmak.ai/<leaked-page>/ -o /dev/null -w '%{http_code}\n'        # expect 404
```

Re-enable the digest cron and branch protection when done.

---

## 2. Wayback Machine exclusion

1. Enumerate what the Internet Archive captured:
   ```bash
   curl "https://web.archive.org/cdx/search/cdx?url=sjarmak.ai*&output=text&fl=original,timestamp&collapse=urlkey" \
     | grep -i -e '<leaked-slug>' -e 'llms'
   ```
   Browse: `https://web.archive.org/web/*/www.sjarmak.ai/*`
2. Email **info@archive.org** from the domain owner's address
   (gibsonsteph42@gmail.com, and mention control of sjarmak.ai — they may ask
   for verification via a DNS TXT record or a file on the site). Include:
   - the exact capture URLs (`https://web.archive.org/web/<timestamp>/<url>`)
   - a request to (a) remove the listed snapshots and (b) exclude the specific
     paths from future capture
   - a one-line reason: "these pages exposed private personal notes
     unintentionally published; the live pages have been removed"
3. They typically respond within days. Re-run the CDX query after confirmation
   to verify the snapshots return `blocked`/no results.

---

## 3. Search-engine and scraper takedown checklist

Work top to bottom; the first two are self-service and fast.

- [ ] **Google** — Search Console removals (site is verified for sjarmak.ai):
      <https://search.google.com/search-console/removals> → New Request →
      each leaked URL (temporary ~6-month hide, immediate). Because the pages
      now 404, also file the permanent version:
      <https://search.google.com/search-console/remove-outdated-content>
      Spot-check with `site:sjarmak.ai "<distinctive leaked phrase>"`.
- [ ] **Bing** — Webmaster Tools content removal:
      <https://www.bing.com/webmasters/tools/contentremoval> → "Remove
      outdated cache" + "Remove page" per URL. (Bing feeds DuckDuckGo and
      Yahoo, so this covers those too.)
- [ ] **Common Crawl** — published crawl archives are immutable; there is no
      self-service removal. Email **info@commoncrawl.org** with the URLs and
      request exclusion from future crawls, and add a `CCBot` block to
      `public/robots.txt` so subsequent crawls skip the paths:
      ```
      User-agent: CCBot
      Disallow: /
      ```
- [ ] **archive.today / archive.ph** — check
      `https://archive.ph/https://www.sjarmak.ai/*` for snapshots. It ignores
      robots.txt and has no removal form; email the contact listed in its FAQ
      (<https://archive.ph/faq>, currently dmca@archive.today) with the
      snapshot URLs and a privacy-based removal request. Expect slow or no
      response; note the attempt in the incident log either way.
- [ ] **AI crawlers** — `/llms.txt` and `/llms-full.txt` exist precisely to be
      ingested, so treat LLM training pipelines as scrapers here. After the
      redeploy in 1.6, file data-deletion requests if the leak included
      personal data: OpenAI <https://privacy.openai.com>, Anthropic
      **privacy@anthropic.com**, Perplexity **support@perplexity.ai**. If the
      leaked paths must stay crawler-blocked going forward, add `GPTBot`,
      `ClaudeBot`, and `PerplexityBot` stanzas to `public/robots.txt`.

---

## 4. Policy: rotate or apologize — never retract

If the leaked material names a person, or contains a critique of a person,
project, or employer:

- **Do not retract or deny.** No "that note didn't reflect my views" posts, no
  quiet edits that pretend the text said something else. The removal steps
  above are about limiting distribution of private material, not about
  rewriting what was said.
- **If the content was fair but private:** contact the person directly,
  acknowledge the note existed and leaked, and apologize for the manner of
  disclosure — not for holding the view.
- **If the content was unfair or stale:** apologize for the substance too, in
  the same direct contact. A public correction is appropriate only if the leak
  circulated publicly enough that silence reads as endorsement.
- **Rotate identifiers:** any codename, pseudonym, or shorthand for a person
  or org that appeared in the leak is burned. Pick new ones in the vault so a
  future leak cannot be joined against this one to de-anonymize past notes.
- Record what leaked, who was contacted, and what was said in a private
  incident note in the vault — not in this repo.
