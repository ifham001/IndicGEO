# IndicGEO

Open research on AI answer-engine visibility in Indian language contexts: which brands AI engines recommend, which sources they cite, and how that changes when the question is not asked in English.

[![Code license: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Data license: CC BY 4.0](https://img.shields.io/badge/data-CC%20BY%204.0-lightgrey.svg)](LICENSE-DATA)

Run by [Depra Research](https://depra.ai). Every raw response, script, prompt, seed, and decision log is public, so anyone can recompute the results rather than take them on trust.

**Study 01: Same question, different brands.** Ten brand-unaided purchase-intent prompts (5 skincare, 5 fashion), each an independently reviewed semantically equivalent English/Hinglish pair, run 8 times per language against ChatGPT, Gemini, and Perplexity in a single 57-minute window on 2026-08-14. ChatGPT with web search and Gemini used India-geolocated consumer-UI captures via DataForSEO; Perplexity used the Sonar API with live web search localized to India. 480 responses. Full write-up: [`REPORT.md`](REPORT.md).

## Re-run, October 2026

The identical design was run again on 13 October 2026 (479 responses). The Perplexity effect held and grew (brand-set gap 23.4 → 28.2 points, cited-domain gap 32.4 → 52.6), the Gemini effect mostly closed (7.8 → 2.0 points; citation gap 48.7 → 17.1 points), and the ChatGPT effect did not survive (0.8 points). Across two months the same English question produced brand lists that overlapped only 28% on Perplexity against a within-day rerun overlap of 73%. Data, scripts, lexicon sensitivity, stability spot-check and three independent recomputations are in [`rerun-2026-10/`](rerun-2026-10/README.md); the comparison tables are in [`rerun-2026-10/COMPARISON.md`](rerun-2026-10/COMPARISON.md). The August numbers below are unchanged.

## What we found

An AI engine does not give the same answer twice, so the honest test is not "do the two languages differ" but "do they differ by more than the engine differs from itself." Every gap below is the difference between rerun-to-rerun brand overlap in the same language (the engine's own noise floor) and overlap across languages. All p-values are exact one-sided sign-flip permutation tests over the 10 per-prompt deltas, with the test fixed before analysis.

| Engine | Rerun baseline | Cross-language | Brand-set gap | 95% CI | p | Cited-domain gap | p |
|---|---|---|---|---|---|---|---|
| ChatGPT † | 54.7% | 52.5% | 2.2 pts | [0.3, 4.6] | .046 | 3.1 pts | .033 |
| Gemini | 51.2% | 43.3% | 7.8 pts | [2.6, 13.9] | .0098 | 22.3 pts | .0098 |
| Perplexity | 68.3% | 44.9% | 23.4 pts | [12.9, 35.1] | .0010 | 32.4 pts | .0010 |

† Two-sided p = .092. Treat ChatGPT as approximately language-invariant, not as a demonstrated effect. See the caveat below.

Three things this study shows, within this prompt set.

**1. Gemini serves code-mixed users a thinner answer.** Gemini attached at least one citation to 90.0% of English answers (72/80) but only 41.3% of Hinglish answers (33/80). Mean citation count falls from 9.4 to 5.2, and Hinglish answers are 33% shorter. ChatGPT and Perplexity cite on every answer in both languages (80/80 each). This is the study's largest and most clearly interpretable single effect.

**2. The language effect differs by an order of magnitude across the three engines tested.** Perplexity is simultaneously the most self-consistent engine (68.3% rerun brand overlap, the highest of the three) and the most language-sensitive, so its cross-language drop is behavior rather than noise. ChatGPT sits at the other end. Its one-sided p of .046 is the study's most fragile result: the two-sided p is .092, 4 of its 10 per-prompt deltas are negative, and the effect is carried entirely by the skincare half (skincare mean delta 4.45 points, p = .063; fashion 0.01 points, p = .469). We report it and we do not lean on it.

**3. Individual brands swing hard on Perplexity.** Share of the 80 responses per cell that mention the brand:

| Brand | English | Hinglish | Change |
|---|---|---|---|
| The Derma Co | 2.5% (2/80) | 20.0% (16/80) | +17.5 |
| Deconstruct | 3.8% (3/80) | 16.3% (13/80) | +12.5 |
| Minimalist | 22.5% (18/80) | 33.8% (27/80) | +11.3 |
| Plum | 28.7% (23/80) | 15.0% (12/80) | −13.7 |
| Taneira | 15.0% (12/80) | 0.0% (0/80) | −15.0 |
| La Roche-Posay | 13.8% (11/80) | 1.3% (1/80) | −12.5 |

Gemini moves too, though less (Dot & Key 10.0% to 21.3%, CeraVe 10.0% to 0.0%, Minimalist 45.0% to 36.3%). India-origin brand share rises in the Hinglish arm on Gemini (75.6% to 82.0%) and Perplexity (63.7% to 66.3%), and is flat on ChatGPT (74.4% to 74.7%); we report that as an observed tendency, not a tested hypothesis.

Engines mirror the prompt language almost perfectly. ChatGPT and Perplexity answered 80/80 both ways. Gemini answered 71 of 80 Hinglish prompts in Hinglish, 8 in Devanagari script, and 1 in English.

## Why this matters

A large share of Indian AI-assistant usage is code-mixed rather than English or Devanagari (see [`lit-review/LIT-REVIEW.md`](lit-review/LIT-REVIEW.md) for the sources behind that). Commercial AI-visibility tracking, and nearly all published GEO research, measures English prompts only.

If the brand slate and the source slate move when the same buying question is asked in Hinglish, an English-only measurement does not describe what a large share of Indian users see. On Gemini and Perplexity, that is what the data shows.

For the GEO field, the effect-size hierarchy is consistent with differences in how each engine handles a code-mixed query, but this study does not separate retrieval from generation and cannot attribute the difference to either. That separation is open work.

## What's in this repo

| Path | What it is |
|---|---|
| [`REPORT.md`](REPORT.md) | Study 01 full report v1.0: results, verification, limitations |
| [`METHODOLOGY.md`](METHODOLOGY.md) | Frozen pre-analysis design, controls, and the deviations log |
| [`DATASHEET.md`](DATASHEET.md) | Dataset documentation: composition, collection, uses, distribution |
| [`prompts.json`](prompts.json) | The 10 English/Hinglish prompt pairs, frozen at v1.1 |
| [`run-experiment.mjs`](run-experiment.mjs) | Data collection against DataForSEO, resumable, with retries |
| [`build-lexicon.mjs`](build-lexicon.mjs) | Brand-candidate extraction, the input to manual lexicon curation |
| [`analyze.mjs`](analyze.mjs) | Analysis: Wilson intervals, exact sign-flip permutation tests, clustered bootstrap |
| [`stability-check.mjs`](stability-check.mjs) | Temporal stability spot-check against the held-out rerun cells |
| [`data/README.md`](data/README.md) | Data dictionary and worked examples for reusing the corpus |
| `data/raw/` | 480 primary responses, one JSON per cell, including complete API payloads |
| `data/raw-stability/` | 24 stability-rerun responses, held out of every primary number |
| `data/analysis/` | Lexicon, domain classes, tidy `responses.json`, `results.json`, checksum, stability |
| `data/run.log` | Fieldwork log written during collection, one line per response with timing and cost |
| `lit-review/` | 70-source literature review, prompt-verification log, adversarial-verification log |
| [`CITATION.cff`](CITATION.cff) | Machine-readable citation metadata |

Raw files are named `<promptId>_<lang>_<engine>_r<rep>.json` and carry a `meta` block (prompt, cell, timing, attempts, geolocation), a `response` block (answer text, citations, cost), and `rawApi`, the complete unmodified API response.

## How to reproduce

Requires Node 18 or newer. There are no dependencies to install: the scripts use only the Node standard library, and `run-experiment.mjs` parses `.env` itself rather than depending on dotenv.

**Verify the published analysis.** `analyze.mjs` is deterministic (all bootstrap and permutation seeds fixed, no wall-clock values written to the output), so its result is byte-reproducible:

```bash
node analyze.mjs
shasum -a 256 data/analysis/results.json | cut -d' ' -f1
cut -d' ' -f1 data/analysis/results.sha256
```

Both print the same digest:

```
6f9a67de4c11f11b3e157b1f21799fce66161393d24b5a043eb4a1c395de1776
```

Every number in `REPORT.md` comes out of that run, computed from `data/raw/`. The stability spot-check is separate:

```bash
node stability-check.mjs
```

**Re-collect the data.** Collection calls DataForSEO and needs credentials. Copy `.env.example` to `.env` and fill in `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`, or set them as environment variables:

```bash
node run-experiment.mjs --reps 8    # full collection into data/raw/
node build-lexicon.mjs              # candidate brand strings for curation
node analyze.mjs                    # recompute results.json
```

`run-experiment.mjs` accepts `--prompts`, `--engines`, `--langs`, `--reps`, `--concurrency`, `--max-attempts`, and `--seed` (default 20260814). It is resumable: completed cells are skipped and failures are retried on the next invocation. A pilot is `node run-experiment.mjs --prompts S01 --reps 1`. The full 480-response collection cost $2.16.

Fresh collection will not reproduce the published digest, and it should not. Engine answers change over time, so a new run is a new measurement, not a replication. To check our arithmetic, run `analyze.mjs` over the committed corpus. To check whether the finding still holds today, collect fresh data and compare effect directions.

## Limitations

Stated in full in [`REPORT.md`](REPORT.md) section 8. The ones that most bound interpretation:

Ten prompts in two categories. Results generalize to these prompt classes, not to Indian buying queries at large; per-prompt deltas vary widely, which is why inference is paired at the prompt level. Two fieldwork windows, in August and October 2026, so these are snapshots and engines drift. One Hinglish register (urban, romanized, 43-69% code-mix density), so Devanagari Hindi and other Indian languages are untested. Logged-out default ChatGPT/Gemini captures and Perplexity Sonar API responses may differ from personalized consumer results. Citations are displayed sources, not verified evidence: prior work (Liu et al., Findings of EMNLP 2023) finds roughly a quarter of generative-engine citations fail to support the sentence they are attached to.

Brand labels come from a curated lexicon and are bounded by its completeness. Twenty-six brand names collide with common English or Hindi words and are matched case-sensitively for that reason. That rule is conservative and load-bearing: relaxing it to case-insensitive matching inflates the ChatGPT gap from 2.2 to 13.7 points through Hinglish false positives. The instrument understates rather than manufactures the effect.

**Funding and interest.** This study was designed, funded, and run by Depra, which sells AI-visibility tracking and therefore has a commercial interest in the conclusion that language matters. We cannot remove that interest, so we have tried to make it irrelevant: the prompts were frozen before collection, the statistical tests were fixed before analysis, three rounds of independent verification are logged in `lit-review/`, the corrections that verification forced are recorded in the deviations log, and the entire corpus is published so that a skeptic can recompute every number and reach their own conclusion. The finding we would most like to be true, a large ChatGPT effect, is the one we report as fragile.

## Verification

Four checks are built into the study and each changed it:

1. **Prompt review before analysis.** An independent reviewer audited all 10 pairs for naturalness, semantic equivalence, and purchase intent. Three fashion pairs failed, one for a missing India anchor that would have confounded language with market. All three were rewritten and affected cells recollected before any analysis. Log: [`lit-review/prompt-verification.md`](lit-review/prompt-verification.md).
2. **Adversarial recomputation.** Six independent agents recomputed headline numbers from raw data with their own code, blind to the analysis pipeline. All reproduced, none refuted. Log: [`lit-review/verification-log.json`](lit-review/verification-log.json).
3. **Instrument audit.** That pass surfaced five measurement defects, including a brand name matching as a generic English adjective at a 35% false-positive rate. All were fixed and the pipeline re-run before publication. See the deviations log in `METHODOLOGY.md`.
4. **Temporal stability rerun.** Two prompts were re-collected 30 to 60 minutes later. Direction holds on all three engines, with drift ratios of 0.91, 1.05, and 1.04 against the same two prompts in the primary window.

## Roadmap

Planned, not done. Nothing below has been collected or analyzed.

- Other Indian languages and scripts, including Devanagari Hindi against romanized Hinglish for the same prompts, to test whether script or language drives the effect
- More categories beyond skincare and fashion, and higher-consideration purchases
- Further longitudinal re-runs of the frozen v1.1 prompt set to measure drift over months
- A design that separates retrieval from generation, which this study cannot do
- Wider prompt sets to move from "these prompt classes" toward category-level claims

Issues and pull requests are welcome, particularly replications that disagree with us.

## How to cite

Machine-readable metadata is in [`CITATION.cff`](CITATION.cff).

> Depra Research (2026). *IndicGEO Study 01: Same question, different brands. English versus Hinglish buying prompts across ChatGPT, Gemini, and Perplexity in India* (Version 1.1.0) [Data set]. https://github.com/ifham001/IndicGEO

```bibtex
@misc{depra2026indicgeo,
  title        = {IndicGEO Study 01: Same question, different brands.
                  English versus Hinglish buying prompts across ChatGPT,
                  Gemini, and Perplexity in India},
  author       = {{Depra Research}},
  year         = {2026},
  version      = {1.1.0},
  howpublished = {\url{https://github.com/ifham001/IndicGEO}},
  note         = {Code MIT, data CC BY 4.0}
}
```

## License

Code (`*.mjs`) is MIT, see [`LICENSE`](LICENSE). Data, text, and documentation (the corpus under `data/`, the reports, the literature review) are CC BY 4.0, see [`LICENSE-DATA`](LICENSE-DATA). Attribute to Depra Research with a link to this repository.

Third-party content note: `data/raw/` contains verbatim AI-generated answer text and cited URLs captured from ChatGPT, Gemini, and Perplexity. That material is included for research verification under fair-use/fair-dealing principles; the CC BY 4.0 grant covers our own compilation, annotation, and analysis, not the underlying engine outputs or the third-party pages they cite. Brand names are the property of their respective owners and appear here as measurement data, not endorsement.

## Contact

team@depra.ai · [depra.ai](https://depra.ai)
