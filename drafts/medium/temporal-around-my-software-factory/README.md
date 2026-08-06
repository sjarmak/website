# Medium package: "I put Temporal around my software factory"

Paste-ready version of the on-site essay at
<https://www.sjarmak.ai/writing/temporal-around-my-software-factory>.

## Publish it with Medium's import tool, not a raw paste

Use **Medium → your avatar → Stories → Import a story** and give it the
sjarmak.ai URL. Import sets `rel="canonical"` back to the site automatically,
so the site keeps the SEO value and the two copies don't compete. A raw paste
does not set canonical.

`article.md` is the fallback for when import mangles something: paste it into a
new story, then drop each image in at its `[FIGURE NN — file.png]` marker and
delete the marker line. The italic line under each marker is the caption; in
Medium, select it and use the caption style attached to the image.

## Figures, in paste order

| Marker | File | Size | Source |
|---|---|---|---|
| FIGURE 01 | `figures/01-cabo-dinner.png` | 1680×941 | hand illustration |
| FIGURE 02 | `figures/02-reconstructing-the-procedure.png` | 1672×941 | hand illustration |
| FIGURE 03 | `figures/03-ownership.png` | 1984×1114 | rendered from the site's inline SVG @2x |
| FIGURE 04 | `figures/04-workshop.png` | 1672×941 | hand illustration |
| FIGURE 05 | `figures/05-recovery.png` | 1984×1120 | rendered from the site's inline SVG @2x |
| FIGURE 06 | `figures/06-canary-gate.png` | 1672×941 | hand illustration |
| FIGURE 07 | `figures/07-durable-wrongness.png` | 1984×1228 | rendered from the site's inline SVG @2x |

All are at or above Medium's full-width threshold (~1400px). The three diagrams
are exported bare: no title, no figure number, no caption, on a white canvas, so
every caption in this package is Medium text rather than pixels. That keeps them
selectable, searchable, and readable by a screen reader. Alt text for every
figure is in the site version's component source under
`src/components/temporal-agent-orchestration/`.

## What differs from the on-site version

- **The comparison table is prose.** Medium has no table support, so the
  NDI-vs-deterministic-replay table in "Two kinds of recovery" is written out as
  a sentence instead.
- **Links are absolute.** Site-relative links point at `www.sjarmak.ai`.
- **No live components.** `TermTip`, the annotated code reader, and the
  asciinema Worker-kill recording exist only on the site; the essay links out to
  them instead.

## Regenerating the diagram PNGs

The three SVG diagrams are rendered from the published page, so they stay in
sync with the site if the components change:

```bash
npm run build
cd dist && python3 -m http.server 8899 --bind 127.0.0.1 &
node export-figures.mjs http://127.0.0.1:8899 ./figures
```

The script widens the reading column to 1120px before capture (the post renders
in a narrow column) and hides `.concept-figure__index`, since those figure
numbers count against the long-form article's sequence, not this essay's.
