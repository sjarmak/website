---
title: NLS Fine-tune (SciX)
status: active
domain: research
summary: Fine-tuning infrastructure for converting natural language into ADS / SciX scientific-literature search queries.
role: Creator
repo: https://github.com/sjarmak/nls-finetune-scix
architecture: https://sjarmak.github.io/nls-finetune-scix/
links:
  - label: Model — scix-nls-translator (HuggingFace)
    url: https://huggingface.co/adsabs/scix-nls-translator
  - label: Dataset — nls-query-training-data (HuggingFace)
    url: https://huggingface.co/datasets/adsabs/nls-query-training-data
tech: [Python, NLP, SciX]
order: 16
topics: [retrieval]
tags: [scix, nlp]
---

The job is turning "papers by Hawking on black hole radiation from the 1970s" into `author:"Hawking, S" abs:"black hole radiation" pubdate:[1970 TO 1979]`, the structured query syntax behind [SciXplorer](https://scixplorer.org) and NASA ADS. The architecture is hybrid: a deterministic pipeline (entity extraction, retrieval of similar gold examples, rule-based query assembly) answers in under 5 ms, and only when its confidence drops below threshold does the request fall through to a fine-tuned model. The split exists because an early end-to-end model conflated natural-language words with operator syntax, producing queries like `citationsabs:stellar spectra`; separating intent extraction from assembly fixed the whole class of bug rather than instances of it.

The model is Qwen3-1.7B with a LoRA adapter (r=16, about 1% of parameters trainable), chosen small enough to serve in ~50 ms on a modest GPU and ~500 ms on Apple silicon. The training data fuses hand-curated natural-language-to-query pairs, real queries from ADS search logs paired with generated descriptions, and synthetic template cases, all deduplicated and validated; it has grown to roughly 62,000 examples. The validation step that mattered most rejects any natural-language side containing ADS syntax, because description-generation leakage was teaching the model to parrot operators. Data quality took four curation rounds of reviewer passes to converge.

Evaluation is two-layered by cost. Syntax validity runs through an offline grammar linter with no API calls, clearing 98.7% on a 301-query benchmark. Semantic match is result-set overlap: both the expected and generated queries are executed against the live ADS API and compared by Jaccard similarity of their top-50 results, which counts functionally equivalent queries as correct even when the strings differ. On a 50-query semantic set the fine-tuned 1.7B model reached 72% match, and the current hybrid numbers are being remeasured as the dataset has grown.

The infrastructure arc is its own lesson: the original Modal training-and-serving setup was costly enough to be worth escaping, and the replacement (training on a Colab A100 in roughly 90 minutes for under $2, serving through a vLLM-compatible Docker server on whatever hardware is around) does the same job. The model and training data are public on HuggingFace under the adsabs organization. Next steps are grammar-constrained decoding so malformed queries become structurally impossible rather than post-hoc repaired, and a telemetry flywheel that retrains on the fallback queries users actually correct.
