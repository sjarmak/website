# arXiv submission handoff

Prepared August 5, 2026 for the public-review edition of *Engineering Reliable Coding Agents*.

## Upload files

- Upload `engineering-reliable-coding-agents-arxiv-source.zip` as the source archive.
- Use **LaTeX in PDF mode (pdfLaTeX)** if arXiv asks you to choose a processor.
- Compare arXiv's generated PDF with `engineering-reliable-coding-agents-preview.pdf` before completing the submission.
- The archive contains `main.tex`, 19 chapter/closing files, the scholarly front matter, and 19 PDF figures. It contains no generated PDF, log, auxiliary files, Markdown sources, private notes, website code, or unused assets.

## Paste-ready metadata

**Title**

Engineering Reliable Coding Agents: Evaluation, Recovery, Context, and Control Beyond the Model

**Authors**

Stephanie Jarmak

Add an affiliation only if it is current and you want it in the public metadata. arXiv requires accurate current affiliations and does not require an affiliation when none is appropriate.

**Abstract** — 1,344 characters excluding the final newline; arXiv's maximum is 1,920.

AI coding agents are commonly assessed as models but deployed as systems whose behavior also depends on evaluation harnesses, execution state, retrieval, permissions, review interfaces, and resource allocation. This technical monograph synthesizes evidence for engineering reliability at those system boundaries. Its evidence base comprises 118 scholarly sources organized into seven topic-specific review threads, 91 practitioner records, a 29-benchmark catalog, and 17 project dossiers. Evidence items are classified independently by source type and strength; a separate audit rechecks high-strength synthesis claims against underlying sources. From this corpus, two independent derivations produced a catalog of 192 bounded practices, of which 55 are developed in depth. The monograph contributes the evidence audit and practice catalog; a dependency chain connecting measurement, grading, containment and recovery, context, oversight, and allocation; scoped measurements and failure analyses from author-operated systems; and runnable protocols for local evaluation and fault testing. The synthesis is structured rather than exhaustive, capability results remain time- and workload-dependent, and evidence is uneven across topics. Author-system cases are therefore used as illustrations and are not treated as independent external evidence.

**Comments**

Technical monograph, 216 pages, 19 figures. Includes an evidence audit, a 192-practice companion catalog, and operational protocols for evaluating and running AI coding agents. Public review edition, August 2026.

**Categories**

- Primary: `cs.SE` — Software Engineering
- Cross-list: `cs.AI` — Artificial Intelligence

`cs.SE` is the direct fit because arXiv defines it to cover design tools, software metrics, testing and debugging, and programming environments. `cs.AI` is a restrained secondary audience. Do not add `cs.MA` or `cs.GL` unless the final framing changes materially.

**Other fields**

- Report number: leave blank unless an institution has assigned one.
- Journal reference: leave blank until formally published.
- DOI: leave blank; do not enter the DOI arXiv will assign automatically.
- ACM classification: optional; leaving it blank is reasonable for this monograph.

## Decisions you must make before upload

1. **Freeze v1.** Every announced version remains permanently available. Read the generated PDF as the edition that may be quoted indefinitely. This package says “Public review edition, August 2026.”
2. **Choose the license.** If a commercial or university-press edition remains possible, the conservative default is arXiv's perpetual, non-exclusive license. Do not select CC BY automatically. Check the intended publisher's and any funder's policy first. The selected license is irrevocable for this version.
3. **Check endorsement.** Start a draft submission and select `cs.SE` early. arXiv may require endorsement for a first submission in a new category even when an account already has papers in another archive. If prompted, claim existing papers and use a current institutional email if available; otherwise request endorsement from an eligible author who knows your work.
4. **Link ORCID.** Connect the author's ORCID to the arXiv account and use the same public name form used for the author's other scholarly work.
5. **Perform the author review.** The package conversion and compilation are validated, but the author should still complete the structural freeze, citation check, figure-content check, and final scholarly review before pressing Submit. The method section discloses model-assisted corpus analysis and keeps author-system cases explicitly illustrative.

## Submission sequence

1. Sign in at https://arxiv.org and open a new submission.
2. Select `cs.SE` as primary and add `cs.AI` as the only cross-list.
3. Resolve any endorsement prompt before planning an announcement date.
4. Upload `engineering-reliable-coding-agents-arxiv-source.zip`.
5. Confirm that arXiv identifies `main.tex` as the top-level file and uses pdfLaTeX.
6. Open arXiv's generated PDF. Check the title page, abstract, table of contents, all part/chapter starts, equations, links, and all 19 figures.
7. Paste the ASCII metadata above. Do not paste the heading “Abstract” into the abstract field.
8. Choose the license only after the publisher/funder check.
9. Submit for moderation. arXiv says quality-assurance checks typically take one to four days and can take longer. Announcements normally occur Sunday through Thursday on the Eastern US schedule.
10. After announcement, record the arXiv identifier and DOI, then update the website/publication record. Use replacements for substantive later editions rather than a stream of copy edits.

## Technical validation record

- Clean source compile: passed with Tectonic 0.15.0 using a standard TeX Live-compatible package set.
- Output: 216 letter-size pages, single-spaced, one-inch margins, PDF 1.5.
- Figures: 19/19 included as PDF 1.5; no runtime conversion required.
- Text extraction: passed; approximately 103,000 machine-readable words.
- PDF security: no encryption, JavaScript, forms, or embedded multimedia.
- Remaining TeX diagnostics: two harmless line-box warnings in long evidence-list entries; no missing characters, undefined commands, missing files, or LaTeX errors.
- Archive hygiene: generated `.pdf`, `.log`, `.aux`, `.toc`, and `.xdv` files are excluded.

## Official guidance checked

- TeX submissions: https://info.arxiv.org/help/submit_tex.html
- Metadata fields: https://info.arxiv.org/help/prep.html
- Categories: https://arxiv.org/category_taxonomy
- Cross-listing: https://info.arxiv.org/help/cross.html
- Endorsement: https://info.arxiv.org/help/endorsement.html
- Licenses: https://info.arxiv.org/help/license/index.html
- ORCID: https://info.arxiv.org/help/orcid.html
- Announcement schedule: https://info.arxiv.org/help/availability.html
