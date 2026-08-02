---
title: 1,324 frontier-lab employees asked Washington to pace their own field
cadence: daily
track: general
origin: auto
date: 2026-08-02
summary: Two AI policy letters nine days apart, one with 235 companies behind
  open weights and one with 1,324 frontier-lab employees asking the US
  government to help pace automated AI development, and Anthropic on opposite
  sides of each. A PhilArchive rebuttal argues OpenAI's claimed disproof of
  Connes' Rigidity Conjecture is invalid. Plus a 79-rule CLAUDE.md audit that
  finds only 22% of a project file is what the delete-it-all advice actually
  targets.
topics:
  - ai-policy
  - open-weights
  - agent-tooling
  - context-engineering
  - supply-chain-security
  - inference-economics
unresolvedFacets:
  - supply-chain-security
audioUrl: /media/digests/daily-general-2026-08-02.mp3
durationSec: 686
items:
  - title: Open letters about AI development
    url: https://simonwillison.net/2026/Aug/2/open-letters/#atom-everything
    source: Simon Willison's Weblog
    category: tech_articles
  - title: OpenAI's claimed disproof of Connes' Rigidity Conjecture is invalid
    url: https://philarchive.org/archive/NIEWTCv17
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: I sorted all 79 rules in my CLAUDE.md against Boris Cherny's "delete it
      every 6 months" advice. Only 22% were actually delete candidates
    url: https://www.reddit.com/r/ClaudeCode/comments/1vd9qfm/i_sorted_all_79_rules_in_my_claudemd_against/
    source: ClaudeCode
    category: community
  - title: Enable on-demand expertise with Agent Skills in Genkit Go
    url: https://developers.googleblog.com/enable-on-demand-expertise-with-agent-skills-in-genkit-go/
    source: Google Developers Blog
    category: product_news
  - title: Restricting npm bypass-2FA granular access tokens
    url: https://github.blog/changelog/2026-07-31-restricting-npm-bypass-2fa-granular-access-tokens
    source: Changelogs – The GitHub Blog
    category: product_news
  - title: How to govern agentic AI, MCPs, and AI code assistants
    url: https://about.gitlab.com/blog/govern-agentic-ai-mcps-code-assistants/
    source: GitLab Blog (GitLab Duo etc.)
    category: product_news
  - title: Running Kimi K3 on MI355X at Better Performance per Dollar Than B300
    url: https://www.wafer.ai/blog/kimi-k3-mi355x
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Cloudflare Introduces Meerkat for Strongly Consistent Global Coordination
    url: https://www.infoq.com/news/2026/08/cloudflare-meerkat-consensus/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global
    source: InfoQ
    category: tech_articles
highlights:
  - '"Pacing the Frontier" carries 1,324 frontier-lab employees, including Jakub
    Pachocki, Ilya Sutskever, Dario Amodei, and Jack Clark, asking the US
    government to back an international effort to pace automated AI
    development.'
  - Microsoft's open-weights letter has 235 companies on it (NVIDIA, Amazon, Y
    Combinator, the Linux Foundation, OpenAI as a later signer) and defends
    distillation by name; Anthropic skipped it and published a counter-position
    three days later.
  - A PhilArchive paper argues OpenAI's claimed disproof of Connes' Rigidity
    Conjecture, one of Saturday's "Ten advances in mathematics" headline claims,
    is invalid.
  - 'A 79-rule CLAUDE.md audit splits into 17 model patches, 37 environment
    facts, and 25 preferences: only 22% is what "delete it every six months"
    targets.'
  - GitHub now requires an interactive 2FA challenge for sensitive actions from
    npm granular access tokens that were configured to bypass 2FA.
---

Two open letters in nine days, and the signature lists carry the argument better than the text does. Simon Willison [pulled both together](https://simonwillison.net/2026/Aug/2/open-letters/#atom-everything) this morning. "Open Weights and American AI Leadership," shepherded by Microsoft and dated July 24, has 235 AI-adjacent companies on it: NVIDIA, Amazon, Y Combinator, the Linux Foundation, and OpenAI as a later addition. "Pacing the Frontier," published July 28, carries 1,324 employees of frontier AI companies, including Jakub Pachocki, Ilya Sutskever, Dario Amodei, and Jack Clark, asking the U.S. government to support an international effort to deliberately pace automated AI development. Anthropic is absent from the first list and present on the second, and put out its own position on open-weights models three days after the Microsoft letter went out.

The open-weights letter makes a security argument rather than an ideological one, and that is the part worth borrowing: closed models "can be breached, misused, or fail in ways that outsiders cannot detect," and consolidating capability behind a handful of providers creates single points of failure nobody outside those providers can audit. It also defends distillation by name as legitimate model development, which sits awkwardly next to Dario Amodei's call to crack down on industrial-scale distillation operations. The pacing letter is the more interesting document for anyone shipping agents, because its stated worry is not hypothetical. Anthropic says it produces 80% of its code with Claude Code, OpenAI credited Sol with a 20% cut to end-to-end serving costs, and Kimi K3 designed a chip to serve a nano model built on its own architecture. When 1,324 people who work at the labs write down that the loop is closing, the open question is what a pacing mechanism could look like when the compounding happens inside their own repos.

A rebuttal to yesterday's math news went up on PhilArchive overnight and reached the Hacker News front page: [OpenAI's claimed disproof of Connes' Rigidity Conjecture is invalid](https://philarchive.org/archive/NIEWTCv17). OpenAI's "Ten advances in mathematics and theoretical computer science" post ran Saturday, claiming results across geometry, cryptography, and complexity, with the Connes item among the headline claims. The rebuttal is early and thinly discussed, 23 points and four comments as it crossed the front page, so it reads as a live dispute rather than a settled one. The pattern underneath it is the thing to track: machine-generated proofs arrive faster than the review capacity to check them, and the checking is where the epistemics actually live. Verification lag is the recurring cost of this whole category, and it does not shrink when the generator gets better.

The sharpest practitioner writing of the day came from a Reddit thread. A developer [sorted all 79 rules in their global CLAUDE.md](https://www.reddit.com/r/ClaudeCode/comments/1vd9qfm/i_sorted_all_79_rules_in_my_claudemd_against/) against Boris Cherny's advice at YC Startup School on Monday to delete your CLAUDE.md, your skills, and your hooks every six months and see what the model does. The audit produced a taxonomy worth stealing. Model patches, rules compensating for behavior the model should have gotten right, came to 17 of 79. Environment facts the model cannot observe came to 37: a zsh shell where `${PIPESTATUS[0]}` reads empty so a build that exited 0 gets reported as failed, a repo under iCloud sync turning a one-second cold test run into four minutes. Preferences and decisions with no derivable right answer came to 25. Only the first bucket, 22% of the file, is what the delete-it advice targets, and Claude Code shipping Opus 5 with 80% of its system prompt cut is explicable precisely because a system prompt is almost entirely that one category. The best point in the post is about the experiment itself: "delete it and see what happens" is a test that mostly cannot fail, because a rule firing only on a deploy or a migration returns "seems fine" for every week you don't deploy. Write down what each rule was for before deleting it, and "seems fine" becomes checkable.

That context-budget problem got a runtime answer from Google in the same window. [Genkit Go added Agent Skills](https://developers.googleblog.com/enable-on-demand-expertise-with-agent-skills-in-genkit-go/) built on progressive disclosure: instructions, scripts, and references package into SKILL.md bundles where only the frontmatter metadata sits in the system prompt, and middleware loads the full body when a task matches the description. It is the same discipline the CLAUDE.md audit arrives at by hand, moved into the framework where it does not depend on anyone remembering to prune.

Governance moved on two fronts. GitHub [restricted npm granular access tokens configured to bypass 2FA](https://github.blog/changelog/2026-07-31-restricting-npm-bypass-2fa-granular-access-tokens) from performing sensitive account, org, and package management actions, which now require an interactive 2FA challenge, closing one of the larger credential-based attack paths in the registry and following the supply-chain disruption work GitHub described last week. GitLab published [a piece on governing agentic AI, MCPs, and code assistants](https://about.gitlab.com/blog/govern-agentic-ai-mcps-code-assistants/) that names the structural version of the problem: code completion kept a human in the review loop by construction, since a person accepted every suggestion before it existed, and an agent that opens a merge request, calls a tool, and modifies CI configuration removes that property without supplying a replacement.

Two infrastructure notes worth a bookmark. A [wafer.ai writeup on running Kimi K3 on MI355X](https://www.wafer.ai/blog/kimi-k3-mi355x), claiming better performance per dollar than B300, took 110 points on Hacker News, and inference economics on AMD silicon is a story that matters more for where serving capacity goes next year than any single benchmark table. Cloudflare [introduced Meerkat](https://www.infoq.com/news/2026/08/cloudflare-meerkat-consensus/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global), an internal globally consistent control-plane service built on the QuePaxa consensus algorithm instead of Raft, which permits leaderless writes while holding strong consistency.

What to watch: whether the Connes rebuttal survives contact with reviewers who work in the field, and whether anyone who signed the pacing letter proposes a mechanism concrete enough to argue about.
