---
title: A bare user story costs 29.7% more tokens than a full spec
cadence: daily
track: general
origin: auto
date: 2026-08-29
summary: "Two independent measurements of agent token spend landed within hours
  of each other: an arXiv study of 2,700 Kimi K3 runs putting the
  underspecification tax at 29.7%, and a Sonar benchmark showing a structural
  code graph cuts agent cost 5% to 36% on real refactors. Google shipped Gemini
  Omni 1.1 Flash with frame-level video control and a 360p draft tier, and
  GitHub published the OpenClaw maintainers on what happens when contributions
  outrun human review."
topics:
  - ai-economics
  - model-releases
  - code-intelligence
  - evaluation
  - agentic-coding
  - code-review
  - ai-security
audioUrl: /media/digests/daily-general-2026-08-29.mp3
durationSec: 731
items:
  - title: Can your AI agent be cheaper? Investigating the effects of task
      specifications on token spend in agentic coding tasks
    url: https://arxiv.org/abs/2608.25399
    source: arXiv cs.AI
    category: research
  - title: Why Code Search Makes Coding Agents So Expensive
    url: https://link.mail.beehiiv.com/v2/c/7d9893005bc16a11e18c9eadd1cc2c06826fd3f6412ed76b43ef40f26b01b4918b7a78edd3fb71984fe7e9de05c8a4bf82fdf0dd6ae425252228cfef9aa4fe0f14c7d6ca39074d45c8c6f461da79e9e2a570b439ec387c380a7e4ad29cc76716b220e17048d3920c2cde14fb0cd781d753f726a32bda0dd7859616fac604e34bbd0e48f5ede275e3fcb3951aa227d65273bbd0af852a24dc18eb05b34dddd1e9/285440db3f7e0cd0
    source: Turing Post (guest post by Sonar)
    category: newsletters
  - title: Gemini Omni 1.1 Flash lets you build with more control
    url: https://deepmind.google/blog/gemini-omni-1-1-flash-lets-you-build-with-more-control/
    source: Google DeepMind Blog
    category: product_news
  - title: OpenClaw went viral. Meet the maintainers building and securing it.
    url: https://github.blog/open-source/maintainers/openclaw-went-viral-meet-the-maintainers-building-and-securing-it/
    source: The GitHub Blog
    category: product_news
  - title: "Copilot code review: Resolution reasons and expanded capabilities"
    url: https://github.blog/changelog/2026-08-27-copilot-code-review-resolution-reasons-and-expanded-capabilities
    source: Changelogs – The GitHub Blog
    category: product_news
  - title: "Semgrep Multimodal Goes Beyond Authentication: What we learned from
      Comparing it with Mythos"
    url: https://semgrep.dev/blog/2026/idor-detection-benchmark-semgrep-multimodal
    source: Semgrep Blog
    category: product_news
  - title: How we saved 100 terabytes of memory by optimizing 1.1.1.1's DNS cache
    url: https://blog.cloudflare.com/dns-cache-memory-optimization-1111/
    source: The Cloudflare Blog
    category: product_news
  - title: DuckLabs to Join AWS, Projects to Remain Open Source
    url: https://ducklabs.com/news/2026/08/26/ducklabs-to-join-aws
    source: DuckLabs
    category: product_news
highlights:
  - Reducing a full task spec to a bare user story raised agent token spend
    29.7% across 2,700 Kimi K3 runs; prompt sensitivity ranged 13% to 115% by
    task, and run-to-run variance was unmoved by any prompt change.
  - "Sonar's controlled comparison gave an agent a structural code graph
    alongside grep: a Java interface change ran 36% cheaper, package rename and
    Python compiler change 20%, TypeScript 5%. The company sponsored the post."
  - Gemini Omni 1.1 Flash adds scene extension, start/end frame pinning, video
    reference inputs, 4K upscaling, and a 360p draft tier for iterating before a
    full render.
  - OpenClaw hit ~388,000 stars and 80,000+ commits; maintainers dropped merge
    count as a trust signal after contributors farmed it by duplicating PRs, and
    replaced it with agent transcripts and test screenshots.
  - Copilot code review now covers bot-authored pull requests, including
    GitHub's own cloud agent, and very large PRs it previously skipped.
---

Strip a coding task down from a full specification to a bare user story and the agent spends 29.7% more tokens reaching the same place. That number comes from [2,700 runs of Kimi K3 at three thinking efforts](https://arxiv.org/abs/2608.25399), posted to arXiv yesterday by Jakub Smékal, and the surrounding results are more useful than the headline. Prompt sensitivity is task-dependent and runs from 13% to 115%, so the same underspecification tax that barely registers on one ticket nearly doubles the bill on another. Run-to-run variance stayed flat no matter how the prompt changed, which means the spread you see across repeated runs is not something you can prompt your way out of. The paper also fits a predictor that prices a full distribution of specification and thinking-effort configurations from one cheap probe on an unseen task, landing within 36%.

Within a few hours of that, Turing Post ran a [guest study from Sonar on the other half of the same bill](https://link.mail.beehiiv.com/v2/c/7d9893005bc16a11e18c9eadd1cc2c06826fd3f6412ed76b43ef40f26b01b4918b7a78edd3fb71984fe7e9de05c8a4bf82fdf0dd6ae425252228cfef9aa4fe0f14c7d6ca39074d45c8c6f461da79e9e2a570b439ec387c380a7e4ad29cc76716b220e17048d3920c2cde14fb0cd781d753f726a32bda0dd7859616fac604e34bbd0e48f5ede275e3fcb3951aa227d65273bbd0af852a24dc18eb05b34dddd1e9/285440db3f7e0cd0): not how you phrase the task, but what the agent burns finding the code. Six tasks across four languages, ten runs per side, previously merged open-source commits as ground truth, prompts written without file names or line numbers, and every run required to pass the real build and tests before it counted. Giving the agent a structural code graph alongside grep made a Java interface change 36% cheaper, a package rename 20%, a Python compiler change 20%, a C# return-type change 20% on the typical run, and a TypeScript change 5%. Sonar sponsored the post and the graph is their product, so weigh the numbers accordingly. The completeness claim underneath the cost delta is the one worth arguing about: a text search cannot enumerate every implementor of an interface, and a site that changes behavior indirectly still compiles and still passes tests nobody wrote for a connection they did not know existed. Two independent measurements of agent spend in one day, one on the prompt side and one on the retrieval side, and neither team was measuring the other's variable.

Google shipped [Gemini Omni 1.1 Flash](https://deepmind.google/blog/gemini-omni-1-1-flash-lets-you-build-with-more-control/) yesterday, a multimodal video generation and editing model aimed at giving developers frame-level control rather than raw quality headroom. You can extend an existing scene, pin the starting and ending frames of a shot, pass video inputs as references, upscale a take to 4K, and iterate at 360p before committing to a full render. The 360p draft mode is the part that changes how you'd actually build on it, since the expensive step in a video pipeline is discovering three generations later that the shot was wrong. It hit the Hacker News front page and both the DeepMind blog and the main Google developer blog the same afternoon.

GitHub published [an interview with the OpenClaw maintainers](https://github.blog/open-source/maintainers/openclaw-went-viral-meet-the-maintainers-building-and-securing-it/) that is the best field report yet on what happens when agent-authored contributions outrun human review. The repo, started by Peter Steinberger as a weekend project in November 2025, was at roughly 388,000 stars, 81,000 forks, and more than 80,000 commits as of August 26. Steinberger stopped calling them pull requests: "I don't even call them pull requests. I call them prompt requests." Some contributors were opening hundreds at a time from automated pipelines mining the issue tracker. The adaptation is specific and worth copying. Merge counts became a manipulable trust signal, so people duplicated other people's pull requests to farm the badge, and the maintainers replaced that signal with evidence: agent transcripts, screenshots proving the change was tested, and an explanation of the contributor's reasoning. Steinberger's line on authorship is the cleanest formulation of the new norm anyone has published: "Nobody cares if you wrote the code or not, but we care if you actually thought about this feature." The team also pruned core dependencies and opened direct relationships with the maintainers of what remained, after the recent supply chain attacks.

GitHub's own tooling moved the same direction on the same day. Copilot code review now [covers pull requests authored by bots, including the Copilot cloud agent, and very large pull requests](https://github.blog/changelog/2026-08-27-copilot-code-review-resolution-reasons-and-expanded-capabilities) it previously skipped, and you can record why you resolved a given review comment. Agents reviewing agent-written code was already the practice at OpenClaw, where maintainers described pressing the Copilot review button on every AI-authored submission; it is now the default path on the platform.

Semgrep answered Mythos on the IDOR benchmark that has been running back and forth this week, reporting that [Semgrep Multimodal found 63 manually reviewed IDOR vulnerabilities Mythos missed](https://semgrep.dev/blog/2026/idor-detection-benchmark-semgrep-multimodal). Both sides are vendors publishing on their own corpus, which is the structural problem with every security-agent comparison shipping right now. The useful residue is the disagreement set: 63 findings that one system's authorization reasoning surfaced and another's did not is a more informative artifact than either vendor's aggregate score.

Away from agents, Cloudflare wrote up [how they cut 100 terabytes of memory out of the 1.1.1.1 DNS cache](https://blog.cloudflare.com/dns-cache-memory-optimization-1111/) across the fleet behind Big Pineapple. Worth reading even if DNS is not your problem, since the pressure on memory pricing from AI buildouts has started showing up in non-AI infrastructure budgets.

The ecosystem item to watch: [DuckLabs is joining AWS, with the projects staying open source](https://ducklabs.com/news/2026/08/26/ducklabs-to-join-aws). The commitment is stated plainly, and the question is what governance looks like a year out, which is the same question anyone maintaining a dependency on an acquired open-source project should be asking after reading the OpenClaw maintainers on knowing who maintains your dependencies.

What to watch next: whether anyone reproduces Smékal's token-spend predictor against a second model family. A cost estimate you can compute from one probe before dispatching a task is the missing piece in every agent budget dashboard shipped this year, and one paper on one model is not yet a tool.
