# Re-run, October 2026: is the Hinglish gap still there?

Study 01 was run again on 13 October 2026 with the identical design: the same 10 prompts (`prompts.json` v1.1), the same three engines captured the same way (ChatGPT UI with web search, Gemini UI, Perplexity Sonar with web search, all India-geolocated, via DataForSEO), 8 repetitions per cell, the same brand lexicon v1.1 and the same `analyze.mjs`. The question was whether the August findings survive two months of engine change.

## Headline (both waves, lexicon v1.1)

| Engine | Brand gap Aug → Oct (pts) | Exact p, Oct | Cited-domain gap Aug → Oct | Cites EN Aug → Oct | Cites HG Aug → Oct |
|---|---|---|---|---|---|
| ChatGPT | 2.2 → 0.8 | .24 | 3.1 → 0.7 | 100% → 100% | 100% → 100% |
| Gemini | 7.8 → 2.0 | .063 | 22.3 → 3.0 | 90.0% → 73.4% | 41.3% → 56.3% |
| Perplexity | 23.4 → 28.2 | .001 | 32.4 → 52.6 | 100% → 100% | 100% → 100% |

- **Perplexity:** the language effect is still there and larger. Perplexity also became more self-consistent (rerun brand overlap 68.3% → 76.1%) and now writes Devanagari into answers to romanized prompts: 16 of 80 Hinglish-prompted answers were more than 30% Devanagari by letter count (the classifier threshold), 2 were mostly Devanagari and 26 contained some. In August 13 contained a few Devanagari words and none crossed 30%.
- **Gemini:** the August effect mostly closed. Both gaps are no longer significant at .05, and the citation gap narrowed from 48.7 to 17.1 points from both sides (English cited less, Hinglish cited more). Gemini's rerun overlap fell from 51.2% to 41.5%.
- **ChatGPT:** the fragile August effect did not survive (0.8 points, p = .24). ChatGPT answers are now about twice as long (4,745 characters in English vs 2,222) and carry 6.6 citations on average (vs 2.5).
- **Drift over two months (same prompt, same language, Aug reps vs Oct reps):** brand-set Jaccard 45.6% on ChatGPT, 39.6% on Gemini, 28.4% on Perplexity, against within-wave rerun overlaps of 48 to 73%. Drift ratio 0.89 / 0.86 / 0.40. Perplexity agrees most with itself on the day and least with itself across months.
- **Cited sites:** reddit.com (106 answers) and youtube.com (100) led in August; in October amazon.in led (132 answers), then flipkart.com (82), hindustantimes.com (76), nykaa.com (65), thedermaco.com (64). youtube.com fell from 534 citation occurrences to 43. Total citation occurrences 4,640 → 3,471, mostly because Perplexity attaches 10 sources per answer instead of 19.6.

Full tables: `COMPARISON.md` and `data/analysis/comparison.json`.

## Collection notes

- Primary window 13 Oct 2026, 13:07 to 14:39 UTC, concurrency 6, seed 20261013. 479 of 480 cells; `S04_en_gemini_r5` failed on all retries (Gemini scraper), so its English-Hinglish pair is dropped by the complete-pair rule (Gemini n = 79 per language for paired metrics). Cost $2.14.
- Stability spot-check (S01 + F02, reps 9 and 10) collected 14:40 to 15:00 UTC into `data/raw-stability/`: direction holds on all three engines, drift ratios 1.04 / 1.06 / 0.94.
- Lexicon sensitivity: 11 brands that October answers name in 8 or more answers were absent from v1.1 (Himalaya, Dr. Sheth's, Venusia, Indo Era, Lakmé, Marks & Spencer, KALINI, The Indian Garage Co, Turtle, GoSriKi, Mamaearth). `build-lexicon-v12.cjs` makes v1.2; `data/analysis-v12/` holds both waves analysed with it (gaps 0.9 / 2.4 / 31.4 in October, 2.1 / 8.0 / 23.4 in August). The primary comparison keeps v1.1 on both waves so the August numbers stay as published.
- Gemini Hinglish citation rate: 45 of 80 collected answers (56.3%); a strict complete-pair count gives 44 of 79 (55.7%).
- Data note: some ChatGPT product cards carry Portuguese retailer titles (for example "Sapatilha Puma Skyrocket Lite Preto"); the answer text itself is English or Hinglish.

## Verification

Three independent automated runs recomputed the October headline numbers from `data/raw/` with their own code, without `analyze.mjs` (scripts and outputs in `verification/`). All three reproduced the overlap figures, the English citation rate, the top-cited site and the drift figures to the decimal, and flagged the two definitional points stated above (the citation denominator and the Devanagari threshold).

## Reproduce

```
cd rerun-2026-10
node analyze.mjs                       # data/raw -> data/analysis/results.json (v1.1 lexicon)
node stability-check.mjs               # data/raw-stability -> data/analysis/stability.json
node compare.mjs                       # ../data/analysis (August) vs ./data/analysis (October) -> COMPARISON.md
shasum -a 256 data/analysis/results.json | cut -d' ' -f1
# 35b4664faf472c30b13e99c01846edfe2135f34f3dcfa9fc93c899ff1e310c31
```

A fresh collection (`node run-experiment.mjs --reps 8`, credentials in `../.env` as for the August run) is a new measurement and will not reproduce the digest.

## Files

- `data/raw/` 479 primary cells (complete API payloads), `data/raw-stability/` 24 spot-check cells, `data/run-full.log`, `data/run-stability.log`.
- `data/analysis/`: `results.json` (+ `results.sha256`), `responses.json`, `stability.json`, `comparison.json`, `page-oct.json` (the shape the depra.ai study page reads), `brand-lexicon.json` (v1.1, copy of the root file), `brand-lexicon-v1.2.json`, `lexicon-candidates.json`, `domain-classes.json`.
- `data/analysis-v12/`: both waves under lexicon v1.2.
- Scripts: `run-experiment.mjs`, `analyze.mjs`, `stability-check.mjs`, `build-lexicon.mjs`, `build-lexicon-v12.cjs`, `lexicon-diff.mjs`, `probe-brands.cjs`, `compare.mjs`, `export-page-json.mjs`, `export-rerun-json.mjs`.
- `verification/verify-1..3/`: the independent recomputation scripts and their outputs.

Published summary: section 6 of https://depra.ai/research/hinglish-vs-english-ai-shopping. Licensing as for the root: code MIT, data and text CC BY 4.0.
