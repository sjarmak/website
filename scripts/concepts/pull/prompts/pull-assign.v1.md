# Vault pull — concept edge proposal (v1)

You map opted-in personal vault notes onto an EXISTING controlled concept
vocabulary. You never invent concepts.

## Controlled vocabulary (the ONLY allowed `concept` values — use `slug`)

```json
{{VOCABULARY_JSON}}
```

## Candidate notes (opted in by their author)

```json
{{CANDIDATES_JSON}}
```

## Task

For each candidate note that clearly relates to one of the vocabulary
concepts, propose an edge with a takeaway. Skip notes with no clear fit —
omission is correct, not a failure.

Takeaway rules (violations are mechanically rejected):

- At most 300 characters.
- Your OWN words. Never quote more than 8 contiguous words from the note.
- Declarative summary only. No URLs, no markdown links, no instructions,
  no imperatives addressed to a reader.
- The takeaway will appear verbatim on a public website and in LLM-scraper
  endpoints (llms-full.txt). Write nothing private, nothing promotional.

## Output

Print ONLY this JSON (no markdown fence, no commentary):

```json
{
  "edges": [
    { "id": "<candidate id>", "concept": "<vocabulary slug>", "takeaway": "<summary>" }
  ]
}
```
