import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const expected = ['sunny-narayanan', 'brad-aagaard', 'alex-young', 'david-schimel', 'sarah-stamps', 'ilya-zaslavsky', 'louis-moresi', 'matt-mayernik', 'matthew-graham', 'stephanie-jarmak', 'graziella-caprarelli'];
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const page = (slug = '') => read(`dist/scix_ab_explorers/${slug ? `${slug}/` : ''}index.html`);

test('the hub contains exactly the selected attendees and is unindexed', () => {
  const html = page();
  assert.match(html, /name="robots" content="noindex/);
  for (const slug of expected) assert.ok(html.includes(`/scix_ab_explorers/${slug}`), slug);
  assert.equal((html.match(/data-person-card/g) ?? []).length, 11);
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  assert.ok(main);
  assert.doesNotMatch(main, /mailto:|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
});

test('each field has sourced papers, progression, a reading path, audio and a transcript', () => {
  for (const slug of expected) {
    const data = JSON.parse(read(`src/data/scix-ab/${slug}.json`));
    const html = page(slug);
    assert.match(html, /name="robots" content="noindex/);
    assert.ok(data.person.sources.length > 0, `${slug}: profile sources`);
    assert.ok(data.papers.length >= 12, `${slug}: paper coverage`);
    assert.ok(data.sections.length >= 4, `${slug}: field progression`);
    assert.equal(data.paperCount, data.papers.length);
    assert.equal(new Set(data.papers.map(p => p.bibcode || p.url || p.arxiv)).size, data.papers.length, `${slug}: distinct papers`);
    assert.equal(new Set(data.papers.map(p => p.notes[0].takeaway)).size, data.papers.length, `${slug}: paper-specific synthesis`);
    assert.equal(data.themeCount, data.sections.length);
    const refs = new Set(data.papers.flatMap(p => [p.bibcode, p.arxiv, p.url].filter(Boolean)));
    for (const row of data.reading) assert.ok(refs.has(row[0]), `${slug}: unresolved reading ${row[0]}`);
    for (const section of data.sections) {
      assert.equal(section.count, data.papers.filter(p => p.branches.includes(section.key)).length);
      assert.ok(section.summary.length > 100, `${slug}: ${section.key} summary`);
    }
    for (const paper of data.papers) {
      assert.ok(paper.url || paper.bibcode || paper.arxiv);
      assert.ok(paper.notes.length > 0);
      for (const branch of paper.branches) assert.ok(data.sections.some(s => s.key === branch));
    }
    assert.match(html, /data-paper-search/);
    assert.match(html, /A reading path/);
    assert.match(html, /Open problems/);
    assert.match(html, /<audio controls/);
    assert.ok(html.includes(data.podcast.audioUrl));
    assert.match(data.podcast.audioUrl, /\.mp3\?v=[a-f0-9]{7,40}$/, `${slug}: versioned media URL avoids cached pre-deployment 404s`);
    assert.ok(data.podcast.durationMin > 0, `${slug}: measured audio duration`);
    assert.match(html, /Read transcript/);
    const transcript = read(`src/data/scix-ab/transcripts/${slug}.md`);
    assert.ok(transcript.split(/\s+/).length >= 1400, `${slug}: substantive episode`);
  }
});

test('advisory explorers stay out of public discovery surfaces', () => {
  for (const name of readdirSync(new URL('dist/', root)).filter(n => /^sitemap.*\.xml$/.test(n))) {
    assert.ok(!read(`dist/${name}`).includes('/scix_ab_explorers'));
  }
  for (const route of ['index.html', 'library/index.html', 'digest/index.html']) {
    assert.ok(!read(`dist/${route}`).includes('/scix_ab_explorers'), route);
  }
});
