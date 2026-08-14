# Does prompt language change what AI recommends you buy? English vs Hinglish buying prompts across ChatGPT, Gemini, and Perplexity in India

**Study ID:** hinglish-geo-study v1.0
**Fieldwork window:** August 2026 (exact timestamps recorded per response in `data/raw/`)
**Status:** METHODOLOGY DRAFT, frozen before analysis; any post-hoc change must be logged in the Deviations section.

## 1. Research question

For purchase-intent queries in two high-consideration consumer categories (skincare, fashion), does asking in Hinglish (romanized Hindi-English code-mix) instead of English change:

- **RQ1 (Brands):** which brands the engine recommends, and which brand it names first?
- **RQ2 (Sources):** which web sources the engine cites (domains, share of .in domains, marketplace vs publisher vs brand-site mix)?
- **RQ3 (Answer language):** the language the answer comes back in?
- **RQ4 (Stability):** and are cross-language differences larger than the engine's own rerun-to-rerun noise?

RQ4 is the study's core honesty device: a language effect only "exists" if the English-vs-Hinglish difference exceeds the difference between two identical reruns of the same prompt.

## 2. Why this matters

A large share of Indian AI-assistant usage is code-mixed. If engines recommend different brands or cite different sources for Hinglish queries, then (a) brand AI-visibility tracking that only monitors English prompts is systematically blind, and (b) GEO/AEO optimization advice built on English-only measurements may not transfer to how Indian consumers actually ask. No controlled EN-vs-Hinglish buying-prompt comparison existed in prior literature at the time of fieldwork (see `lit-review/`).

## 3. Design

Factorial design: **10 prompts × 2 languages × 3 engines × 8 repetitions = 480 responses.**

| Factor | Levels | Notes |
|---|---|---|
| Prompt | 10 (5 skincare, 5 fashion) | Frozen in `prompts.json` v1.1 before analysis |
| Language | English, Hinglish | Paired; identical intent and constraints |
| Engine | ChatGPT, Gemini, Perplexity | See §4 for capture method |
| Repetition | 8 per cell | Per the convergence analysis in Schulte et al. (arXiv:2604.07585), which recommends 7-8 runs for stable per-brand detection rates; also powers the rerun-noise baseline (RQ4) |

### Prompt construction

- All prompts are purchase-intent and brand-unaided (no brand appears in any prompt).
- Hinglish versions are authentic romanized code-mix (category nouns in English, function words in romanized Hindi), not literal translation. No Devanagari anywhere.
- Pairs were checked by an independent review pass for naturalness, semantic equivalence, and purchase intent before freezing (log kept in `lit-review/prompt-verification.md`).

### Controls

- **Geography:** every call is India-geolocated (DataForSEO `location_code` 2356 for UI captures; `web_search_country_iso_code=IN` for Perplexity).
- **Interface-language hint** held constant at `en` for both conditions; the only manipulated variable is the prompt text itself.
- **No session carryover:** every call is a fresh, stateless request (no chat history, no account personalization).
- **Execution order** is a seeded random shuffle (seed 20260814) interleaving languages, engines, and prompts, so no condition is confounded with time of day.
- **Same fieldwork window** for all cells; timestamps stored per response.

## 4. Engine capture

| Engine | Endpoint | What it captures |
|---|---|---|
| ChatGPT | DataForSEO `chat_gpt/llm_scraper/live/advanced`, `force_web_search: true` | The chatgpt.com consumer UI in Search mode, with citations, as served to an India-located user |
| Gemini | DataForSEO `gemini/llm_scraper/live/advanced` | The gemini.google.com consumer UI as served to an India-located user |
| Perplexity | DataForSEO `perplexity/llm_responses/live`, model `sonar`, `web_search: true` | Perplexity Sonar API answer with live web search, India market |

ChatGPT and Gemini are real consumer-UI captures (what a user sees), not API approximations. Perplexity is API-equivalent to its consumer product's default model. This mirrors the production capture stack of Depra (depra.ai), which funded the study.

## 5. Data collection protocol

- Runner: `run-experiment.mjs` (in this directory; the exact code that ran is committed with the data).
- Retries: up to 5 attempts per cell with exponential backoff (10s/30s/60s/120s + jitter). Empty or <40-char answers count as failures and are retried.
- Every successful cell stores: prompt metadata, timestamps, attempt log, answer text, ordered citations, per-call cost, and the **complete raw API response** (`data/raw/<cell>.json`), so every derived number is recomputable from the raw record.
- Cells that exhaust retries are recorded as permanent failures and disclosed in the report. Analysis uses only cells successful in both languages of a pair (complete-pair analysis) for paired metrics.

## 6. Measures

Per response:

- **Brand mentions:** deterministic case-insensitive word-boundary match of the answer text against a published brand lexicon (`data/analysis/brand-lexicon.json`). The lexicon is built as the union of candidate brand names observed across all 480 responses (capitalized-span extraction plus manual review), each entry with alias list and an India-origin flag; the lexicon itself is part of the study's published artifacts. Deterministic matching makes the extraction step fully reproducible. Brand names that collide with common English or Hindi words (26 entries flagged `risky_alias`, e.g. "Bata" vs the Hinglish verb phrase "bata do", "Libas" as the Hindi noun for clothing) are matched case-sensitively in their listed capitalization; all other aliases match case-insensitively. Without this rule, collisions would inflate those brands specifically in the Hinglish arm, a language-correlated measurement bias. All risky-alias matches are additionally spot-checked in the verification pass.
- **First-mentioned brand** (earliest character offset of any lexicon match).
- **Citation domains:** registrable domain of each citation URL; .in TLD share; domain class (marketplace / publisher-blog / brand site / other), classified by a published mapping table.
- **Answer language:** three-way classification (English / Hinglish / Hindi-Devanagari) via script detection plus a romanized-Hindi function-word ratio; classifier code published with the study.
- **Answer length** (characters) and brand count.

Aggregates:

- **Brand visibility** per (brand, engine, language): share of the 80 responses (10 prompts × 8 reps) mentioning the brand, with 95% Wilson score intervals.
- **Cross-language brand overlap:** Jaccard similarity of per-response brand sets between paired EN and HG responses of the same prompt+engine.
- **Rerun-noise baseline:** Jaccard similarity between same-language repetitions of the same prompt+engine (all within-condition rep pairs).
- **Language effect test (RQ4):** permutation test comparing mean cross-language Jaccard against mean within-language Jaccard, per engine and pooled; bootstrap 95% CIs on the difference.
- Same overlap machinery applied to citation-domain sets for RQ2.

## 7. Statistical treatment

- **Unit of analysis:** prompts are clusters; repetitions are within-cluster resamples; EN-vs-HG is a paired comparison at the prompt level (Miller, arXiv:2411.00640). Inference is never run over raw responses as if independent.
- **Primary inference (RQ4):** exact paired sign-flip permutation test per engine. Per-prompt statistic d_p = (mean within-language Jaccard) − (mean cross-language Jaccard); with N=10 prompts the full 2^10 = 1024 sign-flip distribution is enumerated, giving exact p-values with no distributional assumptions (Ernst 2004; Dror et al., ACL 2018). A within-cell label-shuffle permutation (10,000 iterations) is reported as a sensitivity check.
- **Proportions:** 95% Wilson score intervals, never Wald (Brown/Cai/DasGupta 2001; Bowyer et al., ICML 2025).
- **Set-overlap CIs:** clustered bootstrap over prompts (10,000 resamples).
- **Rank claims** restricted to coarse top-3 membership (brand among first three mentioned), following the stability hierarchy established by prior work: brand appearance rate > brand set > cited domain set > cited URL set. URL-level analysis is out of scope (same-day URL overlap baselines are single-digit percent in prior work).
- **Per-engine and per-category everything:** engines are never pooled (cross-engine top-brand agreement is ~42% in prior work); skincare and fashion are reported separately, with pooled results shown for context only.
- Citations are reported as **displayed sources**, not verified evidence provenance (only ~75% of generative-engine citations support their sentence; Liu et al., EMNLP Findings 2023).
- **Integration flag:** ChatGPT mentions/citations of Nykaa are additionally flagged, since the Nykaa-OpenAI Agentic Commerce Protocol integration (June 2026) can structurally tilt ChatGPT answers in exactly these categories; affected numbers are reported with and without the flag.
- No p-hacking surface: RQ1-RQ4 and their tests were fixed in this document before analysis began. Anything else reported is labeled exploratory.

## 8. Known limitations (disclosed up front)

1. **N = 10 prompts** in 2 categories. This is a deep pilot on buying prompts, not a market-wide census; CIs are reported everywhere and category-level claims are bounded accordingly.
2. Single fieldwork window; engine behavior drifts over time. A temporal-stability spot-check rerun is included (§9), but longitudinal claims are out of scope.
3. UI-capture proxies: DataForSEO's captures are of logged-out/default surfaces; personalized results for signed-in users may differ.
4. One Hinglish register: urban, romanized, English-noun-heavy code-mix. Other registers (heavier Hindi, Devanagari, other Indian languages) are future work.
5. Brand extraction depends on lexicon completeness; mitigated by building the lexicon from the corpus itself plus manual review, and publishing it.
6. The study was funded and executed by Depra, an AI-visibility tracking product with a commercial interest in this topic. All raw data, code, and the frozen methodology are published to allow independent recomputation.

## 9. Verification protocol

- **Pilot** (1 prompt pair × 3 engines) validated parsing before the full run.
- **Adversarial recomputation:** after the primary analysis, independent verification agents recompute headline numbers directly from `data/raw/` without access to the analysis code, and spot-check brand extraction against the underlying answer texts.
- **Stability rerun:** a subset (2 prompts × 2 languages × 3 engines) is re-collected later in the fieldwork window; headline direction must survive.

## 10. Deviations log

- **2026-08-14T14:10Z**: Post-verification corrections, before publication. The adversarial recomputation pass confirmed every headline number but surfaced five instrument defects, all fixed and re-run: (1) lexicon v1.0 → v1.1: `context_regex` added for "Simple" (35% false-positive rate as a generic adjective, skewed toward the Hinglish arm) and "Asian" (phantom match in citation anchor text); `exclude_following` added for "Lee" (double-tagged when only "Lee Cooper" was present); (2) answer-language classifier: English-collision tokens (me, to, hi, na, par, lo, ya, mil) removed from the Hinglish marker list; Devanagari rule changed to >30% share of letters with URLs stripped first. Effect of all fixes on headlines: ChatGPT brand Δ 2.1 → 2.2 (exact one-sided p .0352 → .0459), Gemini 7.9 → 7.8 (p .0098), Perplexity 23.8 → 23.4 (p .0010); answer-language table now matches the verifier's independent script-level scan exactly. All numbers in REPORT.md are from the corrected pipeline.
- **2026-08-14T13:05Z**: Repetitions raised 5 → 8 per cell (300 → 480 responses) and the primary inference switched to the exact prompt-level sign-flip permutation test, both before any analysis, on the strength of the completed literature review (`lit-review/LIT-REVIEW.md`): Schulte et al. (arXiv:2604.07585) show 5 reps under-powers per-brand detection-rate stability and recommend 7-8; Ernst (2004)/Dror et al. (ACL 2018) prescribe the exact paired permutation for N=10 clusters. Also added: top-3 membership as the only rank claim, per-category splits, displayed-sources framing, and the Nykaa/ACP integration flag.
- **2026-08-14T12:40Z**: Prompt set revised v1.0 → v1.1 during early fieldwork, before any analysis. The independent equivalence review (§3, log in `lit-review/prompt-verification.md`) failed three fashion pairs: F03 was double-barreled (retailer recall contaminating brand recall), F04 lacked an explicit purchase-intent verb, F05 was missing the India anchor in the English version (a market-signal confound with language) and had a plural/singular mismatch. All three were rewritten per the reviewer's exact fixes. The 5 cells already collected under v1.0 for F03/F05 were deleted from `data/raw/` before analysis; all other collected cells used identical text in v1.0 and v1.1. Skincare block unchanged.
