# arXiv submission handoff

Prepared August 5, 2026 for the public-review edition of *Engineering Reliable Coding Agents*.

## Positioning

“Monograph” is a normal scholarly term for a sustained book-length treatment of one subject, but it is not an arXiv metadata field and is not necessary here. This edition uses **technical review** in its title-page positioning line, abstract, and Comments field. That wording foregrounds the evidence synthesis and avoids making the submission sound like either a trade book or a narrowly conventional monograph.

Positioning line:

> An evidence-grounded technical review of the evaluation, operation, and governance of AI coding-agent systems.

## Prepared files

- `engineering-reliable-coding-agents-arxiv-source.zip`: LaTeX release candidate for arXiv.
- `engineering-reliable-coding-agents-preview.pdf`: PDF compiled from that source.
- `engineering-reliable-coding-agents-companion-1.0.0-rc.1.zip`: separate companion research artifact release candidate.
- `reference-audit/README.md`: reference-audit summary.

The manuscript source ZIP does not contain the companion dataset. This keeps the article submission small and self-contained while allowing the catalog and evidence ledger to receive their own version and DOI.

## Paste-ready arXiv metadata

### Title

Engineering Reliable Coding Agents: Evaluation, Recovery, Context, and Control Beyond the Model

### Authors

Stephanie Jarmak

Add an affiliation only if it is current and should be public. Use the same name form as existing publications and connect the ORCID record before submission.

### Abstract

AI coding agents are commonly evaluated as models but deployed as systems whose behavior also depends on evaluation harnesses, execution state, retrieval, permissions, review interfaces, and resource allocation. This technical review synthesizes evidence about reliability at those system boundaries. The source base comprises 118 scholarly works organized into seven topic-specific review threads, 91 practitioner records, 29 benchmark records, and 17 author-system case records. Evidence is grouped as strong, directional, corroborating, or null and conflicting; high-strength synthesis claims were rechecked against their underlying sources. The study contributes an evidence audit, a catalog of 192 bounded practices with 55 developed in depth, a dependency chain across evaluation and operation, scoped measurements and failure cases from author-operated systems, and runnable protocols for local evaluation and fault testing. The review is structured rather than exhaustive, evidence is uneven across topics, and capability results remain time- and workload-dependent. Author-system cases are therefore reported as illustrations and are not treated as independent external evidence.

### Comments

Technical review, 238 pages, 19 figures. Includes an evidence audit, a 192-practice companion research artifact, and runnable protocols for evaluating and operating AI coding agents. Public review edition, August 2026. Companion DOI: [insert DOI].

Remove the final DOI clause if the companion will not be archived before the arXiv submission. Do not submit the bracketed placeholder.

### Categories

- Primary: `cs.SE` — Software Engineering
- Cross-list: `cs.AI` — Artificial Intelligence

Keep the cross-list to these two categories. The contribution centers on software measurement, testing, debugging, programming environments, operations, and governance; multi-agent topology is only one part.

### Other fields

- Report number: leave blank unless an institution has assigned one.
- Journal reference: leave blank until formally published.
- DOI: leave blank for the manuscript; do not enter the DOI arXiv later assigns automatically.
- ACM classification: optional; leaving it blank is reasonable.

## Companion release sequence

The companion should be a separate citable research artifact, not extra files inside the arXiv TeX archive.

1. Complete the author review of `companion-release/`.
2. Choose a companion license separately from the manuscript license. `CITATION.cff` intentionally has no license field yet.
3. Replace release-candidate version `1.0.0-rc.1` with `1.0.0` in the build script and citation metadata.
4. Publish the exact package in a public, version-controlled repository and create a `v1.0.0` release.
5. Connect that repository to Zenodo or another DOI-granting archive and archive the exact tag.
6. Add the DOI to `CITATION.cff`, the companion README, the manuscript’s Data and materials availability statement, and the arXiv Comments field.
7. Rebuild both ZIPs and compile the exact final manuscript archive before uploading.

The companion release contains:

- 192 practice records, including boundary conditions;
- a 564-row evidence and corroboration ledger;
- a crosswalk separating 55 manuscript-developed practices from 137 companion-only practices;
- 29 benchmark records;
- resolved metadata for 308 arXiv identifiers, five DOIs, and other web sources;
- JSON Schemas, provenance hashes, citation metadata, and checksums.

Author-system cases are labeled as illustrations and are explicitly excluded from independent external evidence. Working notes, rejected candidates, private comments, local paths, unpublished raw operational data, and internal derivation records are excluded.

## Reference-audit result

The audit covers all 20 manuscript files and all 192 companion practices.

- 308 unique arXiv identifiers resolved through the official arXiv API; zero unresolved.
- Five DOI records resolved through Crossref; zero unresolved.
- 28 other web URLs checked with redirects enabled.
- Two official OpenAI pages returned HTTP 403 to the automated client. Open both manually in a normal browser before freezing v1:
  - `https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/`
  - `https://openai.com/index/separating-signal-from-noise-coding-evaluations/`
- The audit found and corrected one author-name defect in the companion source: DynTaskMAS is by Yu, Ding, and Sato, not “Yin.”

Identifier resolution verifies that the cited record exists and captures current metadata. The manuscript’s chapter-level evidence notes remain responsible for claim scope; the strength audit records where a source supports only a mechanism or direction rather than the full practice.

## Decisions required before v1

1. **Structural freeze.** Read the generated PDF as a permanent, citable edition. Check every chapter start, figure, table, equation, source section, and the closing chapter.
2. **Manuscript license.** If a commercial or university-press edition remains possible, arXiv’s perpetual non-exclusive license is the conservative starting point unless a publisher or funder requires a Creative Commons license. Check the intended publisher’s preprint policy first. The selected arXiv license is irrevocable for that version.
3. **Companion license.** Decide independently whether the catalog and benchmark metadata should permit adaptation and redistribution. Do not publish the companion without an explicit license decision.
4. **Endorsement.** Start a draft submission and select `cs.SE` early. A prior record in another archive may not satisfy endorsement for a new computer-science category.
5. **Identity.** Link ORCID and confirm author name and affiliation.
6. **Reference exceptions.** Manually open the two access-restricted OpenAI pages noted above.
7. **Companion DOI.** Either archive the companion first and insert its DOI, or remove the DOI clause and submit with only the public companion-site URL.

## Submission sequence

1. Sign in at `https://arxiv.org` and create a new submission.
2. Select `cs.SE` as primary and `cs.AI` as the only cross-list.
3. Resolve any endorsement prompt.
4. Upload `engineering-reliable-coding-agents-arxiv-source.zip`.
5. Confirm that arXiv identifies `main.tex` as the top-level file and compiles it in PDF mode.
6. Compare arXiv’s generated PDF with `engineering-reliable-coding-agents-preview.pdf`.
7. Inspect the title page, abstract, table of contents, all part and chapter starts, equations, hyperlinks, and all 19 figures.
8. Paste the metadata above without the Markdown headings or any unresolved placeholder.
9. Choose the license only after the publisher/funder check.
10. Submit for moderation. After announcement, record the arXiv identifier and DOI on the website and in the companion metadata.

## Technical validation

- Exact source ZIP compiled in a fresh temporary directory with Tectonic 0.15.0.
- Output: 238 letter-size pages, single-spaced, one-inch margins, PDF 1.5.
- Figures: 19 of 19 included as PDF.
- Text extraction: approximately 104,500 machine-readable words.
- PDF security: no encryption, JavaScript, forms, or embedded multimedia.
- Archive hygiene: 43 required files; no generated PDF, log, auxiliary file, Markdown source, dataset, or private note.
- TeX diagnostics: no errors, missing files, missing characters, undefined commands, or overfull boxes. A small number of harmless underfull-box warnings remain in source-list paragraphs.
- Prose checks: zero failures under the manuscript prose linter after the academic-register sweep.
- Companion checks: catalog and benchmark JSON validate against their schemas; checksums pass; the CSV contains 564 records with a consistent 11-column structure.

## Official arXiv guidance

- TeX submissions: https://info.arxiv.org/help/submit_tex.html
- Metadata preparation: https://info.arxiv.org/help/prep.html
- Category taxonomy: https://arxiv.org/category_taxonomy
- Cross-listing: https://info.arxiv.org/help/cross.html
- Endorsement: https://info.arxiv.org/help/endorsement.html
- Licenses: https://info.arxiv.org/help/license/index.html
- ORCID: https://info.arxiv.org/help/orcid.html
- Announcement schedule: https://info.arxiv.org/help/availability.html
