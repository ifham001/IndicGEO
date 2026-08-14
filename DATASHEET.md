# Datasheet: IndicGEO Study 01 corpus (English vs Hinglish purchase-intent prompts, three AI answer engines, India)

Following the datasheet template of Gebru et al., "Datasheets for Datasets" (2021).

| Field | Value |
|---|---|
| Dataset name | IndicGEO Study 01 corpus (`hinglish-geo-study`) |
| Version | 1.0 (recorded as `1.0.0` in `CITATION.cff`) |
| Fieldwork date | 2026-08-14 |
| Created by | Depra Research (depra.ai) |
| Contact | team@depra.ai |
| Repository | https://github.com/ifham001/IndicGEO |
| Code license | MIT |
| Data and text license | CC BY 4.0 |
| Copyright | Depra Research, 2026 |
| Primary instances | 480 AI answer-engine responses |
| Held-out instances | 24 temporal-stability responses |
| Total size on disk | approximately 14 MB (13 MB raw, 628 KB stability, 708 KB derived, 84 KB run log) |
| Integrity check | SHA-256 of `data/analysis/results.json` = `a1afac1d716bf845fdee2d31941b672c1e728d44e459eac13c854740a12203e2` |

---

## 1. Motivation

**For what purpose was the dataset created?**

To answer one question with enough statistical care that the answer is trustworthy: when an Indian consumer asks an AI answer engine a buying question in Hinglish (romanized Hindi-English code-mix) instead of English, does the engine recommend different brands, cite different sources, and answer in a different language?

The question exists because a large share of Indian AI-assistant usage is code-mixed, while commercial AI-visibility tracking, and nearly all published generative-engine-optimization (GEO) research, measures English prompts only. If engine behavior differs by prompt register, then English-only measurement is systematically blind to what a large user population actually sees. A 70-source literature review conducted before fieldwork (`lit-review/LIT-REVIEW.md`) found prior work on clean translation between major languages, but no controlled study of code-mixed input, none geolocated to India, and none on purchase-intent prompts.

The dataset was designed as a deep pilot rather than a census: 10 prompt pairs, 2 product categories, 3 engines, 8 repetitions, with every claim carried by intervals and exact tests.

**Who created the dataset and on behalf of which entity?**

Depra Research, the research arm of Depra (depra.ai). Design, collection, analysis, and verification were all conducted in-house, with independent review passes described in §4.

**Who funded the creation of the dataset?**

Depra funded it directly. Total third-party API cost was $2.158731, split by engine as ChatGPT $0.6400, Gemini $0.6400, Perplexity $0.8787 (recomputable by summing `costUsd` across `data/analysis/responses.json`). No external grant, sponsor, or client was involved.

**Any other comments?**

Conflict of interest, stated plainly: Depra sells AI-visibility tracking. A finding that English-only measurement is incomplete is commercially convenient for Depra. The mitigation is not a claim of neutrality, it is full publication: the frozen pre-analysis methodology, the exact collection and analysis code, all 504 raw API payloads, the curated lexicon and classification tables, and a byte-reproducible analysis output with a published checksum. A skeptical reader can recompute every number without trusting the authors.

---

## 2. Composition

### 2.1 What do the instances represent?

One instance is **one response from one AI answer engine to one prompt on one repetition**, captured through a third-party scraping/API provider (DataForSEO) with India geolocation. An instance is machine-generated text plus its displayed citations plus collection metadata. Instances are not people, documents, or products.

Each instance is identified by a `cellId` of the form `<promptId>_<lang>_<engine>_r<rep>`, for example `S03_hg_perplexity_r4`.

### 2.2 How many instances are there in total?

| Set | Instances | Location |
|---|---|---|
| Primary corpus | 480 | `data/raw/` |
| Temporal-stability rerun (held out) | 24 | `data/raw-stability/` |
| Total raw responses | 504 | |

The primary corpus is a complete factorial design:

**10 prompts x 2 languages x 3 engines x 8 repetitions = 480.**

Every one of the 60 (prompt, language, engine) cells contains exactly 8 responses. There are no missing cells and no permanent collection failures.

| Engine | English | Hinglish |
|---|---|---|
| ChatGPT | 80 | 80 |
| Gemini | 80 | 80 |
| Perplexity | 80 | 80 |

The 24 stability responses are repetitions 9 and 10 for two prompts (S01, F02) in both languages on all three engines. Their origin is disclosed rather than dressed up: a top-up collection job was still writing extra repetitions into `data/raw/` while verification was running. The primary corpus was frozen at repetitions 1 to 8, the extra repetitions were moved out into `data/raw-stability/`, and they were then put to use as a temporal stability check. That is why the directory exists in the shape it does, and the same account appears in §4.5.

They were captured between 13:23:22Z and 13:25:47Z, after the primary window closed at 13:22:00Z. Measured against the first repetition of each matched primary cell the gap is 39 to 59 minutes; measured against the last repetition of that cell it is 2 to 18 minutes. This is a short-horizon check, not a longitudinal one.

The stability set is **deliberately excluded from every primary statistic**. Including it would break the balanced 8-repetition design.

### 2.3 Is the dataset a sample of a larger set?

Yes, in three senses, each of which bounds generalization:

1. **Prompt sample.** 10 prompts drawn from two high-consideration consumer categories (5 skincare, 5 fashion), not sampled probabilistically from any query log. They were written to be typical brand-unaided purchase-intent questions and then independently reviewed for naturalness, semantic equivalence across the language pair, and purchase intent. They are not representative of all Indian buying queries and were never intended to be.
2. **Temporal sample.** All 480 primary responses were captured inside a single window on 2026-08-14 (12:25:47Z to 13:22:00Z). The corpus is a snapshot of three engines on one afternoon.
3. **Repetition sample.** 8 repetitions per cell, chosen because prior convergence work (Schulte et al., arXiv:2604.07585, summarized in `lit-review/LIT-REVIEW.md`) reports that per-brand detection rates stabilize only around 7 to 8 runs per prompt. Engines are stochastic; 8 draws characterize a cell, they do not exhaust it.

### 2.4 What data does each instance consist of?

#### Raw schema: `data/raw/<promptId>_<lang>_<engine>_r<rep>.json`

Three top-level keys: `meta`, `response`, `rawApi`.

`meta`:

| Field | Type | Description |
|---|---|---|
| `study` | string | Always `"hinglish-geo-study"` |
| `promptsVersion` | string | Version of `prompts.json` in force when the cell was collected (`"1.0"` or `"1.1"`; see §2.8) |
| `promptId` | string | `S01`..`S05` (skincare), `F01`..`F05` (fashion) |
| `category` | string | `skincare` or `fashion` |
| `lang` | string | `en` or `hg` (Hinglish) |
| `engine` | string | `chatgpt`, `gemini`, or `perplexity` |
| `rep` | integer | Repetition index, 1..8 primary, 9..10 stability |
| `promptText` | string | The exact prompt string sent |
| `cellId` | string | `<promptId>_<lang>_<engine>_r<rep>` |
| `startedAt` | ISO 8601 | Request start, UTC |
| `finishedAt` | ISO 8601 | Response received, UTC |
| `durationMs` | integer | Wall-clock request duration |
| `attempt` | integer | Which attempt succeeded. Up to 5 attempts were permitted; the observed maximum in this corpus is 2 (7 of 480 responses) |
| `attemptsLog` | array | Failure records for earlier attempts, empty when `attempt` is 1 |
| `locationCode` | integer | DataForSEO location code, always `2356` (India) |
| `countryIso` | string | Always `"IN"` |

`response`:

| Field | Type | Description |
|---|---|---|
| `text` | string | The answer as markdown, exactly as returned |
| `citations` | array | Ordered list of `{ url, source_name?, position }`. `source_name` is present on 1,483 of the 4,640 citations (ChatGPT 408 of 408, Gemini 1,075 of 1,164, Perplexity 0 of 3,068) |
| `costUsd` | number | Provider cost of this single call |

`rawApi`: the complete unmodified DataForSEO response envelope (`version`, `status_code`, `status_message`, `time`, `cost`, `tasks_count`, `tasks_error`, `tasks`). Nothing is stripped. Every derived field in the tidy dataset can be recomputed from `rawApi` alone.

Stability files in `data/raw-stability/` use the identical schema.

#### Tidy schema: `data/analysis/responses.json`

An array of 480 objects, one per primary response, produced deterministically by `analyze.mjs`. Fields are listed in the order `analyze.mjs` emits them, so this table can be diffed against the file directly.

| Field | Type | Description |
|---|---|---|
| `cellId` | string | Join key to the raw file |
| `promptId` | string | `S01`..`F05` |
| `category` | string | `skincare` or `fashion` |
| `lang` | string | `en` or `hg` |
| `engine` | string | `chatgpt`, `gemini`, `perplexity` |
| `rep` | integer | 1..8 |
| `startedAt` | ISO 8601 | Copied from `meta` |
| `durationMs` | integer | Copied from `meta` |
| `attempt` | integer | Copied from `meta` |
| `textLength` | integer | Characters in `response.text` |
| `answerLanguage` | string | `english`, `hinglish`, or `hindi-devanagari` (classifier in §4.4) |
| `brands` | string[] | Canonical brand names matched in the answer text, ordered by first character offset |
| `firstBrand` | string / null | Brand with the earliest character offset; `null` when no brand matched |
| `top3Brands` | string[] | First three distinct brands by character offset |
| `nykaaInText` | boolean | Word-boundary match on "nykaa" in the answer body |
| `nykaaCited` | boolean | A cited hostname contains "nykaa" (see §4.3) |
| `indiaOriginShare` | number / null | Fraction of matched brands flagged `india_origin`; `null` when no brand matched (4 rows) |
| `nCitations` | integer | Number of displayed citations, duplicates included |
| `citationDomains` | string[] | Distinct hostnames, `www.` stripped, lowercased, in first-appearance order |
| `domainClassCounts` | object | Counts per class over `citationDomains`: `marketplace`, `brand-site`, `publisher`, `social`, `health-pharma`, `other`. Classes with a count of zero are omitted from the object |
| `inTldShare` | number / null | Share of cited domains ending in `.in`; `null` when the response has no citations (55 rows) |
| `costUsd` | number | Provider cost of this call |

#### Other files in the corpus

| File | Contents |
|---|---|
| `prompts.json` | The frozen v1.1 prompt set: 10 pairs with id, category, subcategory, price cap, English text, Hinglish text, plus the 7 design rules and the revision note |
| `data/run.log` | Timestamped fieldwork log written by `run-experiment.mjs`, 1,039 lines: one line per collected cell plus run start, progress, and completion markers |
| `data/README.md` | Data dictionary and worked reuse examples for this corpus |
| `data/analysis/responses.json` | The 480-row tidy dataset described above |
| `data/analysis/brand-lexicon.json` | 112 curated product brands with aliases, `india_origin` flag, category, and safety flags, plus a `curation_rules` array of 8 entries (7 numbered rules and a v1.1 note recording the verification-driven additions) |
| `data/analysis/domain-classes.json` | Mapping of observed citation domains to five named classes, with `other` as the implicit sixth bucket |
| `data/analysis/lexicon-candidates.json` | 2,096 raw candidate brand strings with mention and response counts, the input to manual curation |
| `data/analysis/results.json` | All aggregates, Wilson intervals, exact permutation results, bootstrap intervals |
| `data/analysis/results.sha256` | Expected digest of `results.json`: the bare 64-character hex string and nothing else |
| `data/analysis/stability.json` | Per-engine stability-rerun comparison and drift ratios |
| `lit-review/LIT-REVIEW.md`, `lit-review/lit-review.json` | 70-source pre-fieldwork literature review |
| `lit-review/prompt-verification.md` | The independent pre-analysis prompt-equivalence review, including the three failures that forced the v1.1 rewrite |
| `lit-review/verification-log.json` | Full records of the six independent adversarial recomputation checks |

### 2.5 Is there a label or target associated with each instance?

There is no ground-truth label in the supervised-learning sense. There are **derived annotations**, all produced by published deterministic code from published curated tables:

- `brands`, `firstBrand`, `top3Brands`, `indiaOriginShare` from the brand lexicon
- `citationDomains`, `domainClassCounts`, `inTldShare` from URL parsing and the domain-class table
- `answerLanguage` from a rule-based classifier

Their construction, and their failure modes, are documented in §4.

### 2.6 Is any information missing from individual instances?

- `firstBrand` is `null` and `indiaOriginShare` is `null` for the 4 responses in which no lexicon brand matched: `F05_en_chatgpt_r4`, `F05_en_gemini_r2`, `F05_hg_chatgpt_r6`, `F05_hg_chatgpt_r7`. All four are answers to the wedding-saree prompt that discuss fabrics and retailers without naming a product brand. Analyses of India-origin share exclude these responses and report the reduced n.
- Responses with zero citations have an empty `citationDomains` array and `inTldShare` of `null`, not `0`. The 55 such responses are excluded from `.in`-share means, which is why `rq2_citations.inTldShare` carries an `n` below 80 for some cells (Gemini Hinglish drops to 33). Zero citations is common on Gemini Hinglish (47 of 80 answers carry no citation at all) and is itself a finding, not missing data.
- No instance is missing answer text. The collection runner treated empty or sub-40-character answers as failures and retried them.
- The dataset carries no user, session, or account context, by design: every call was stateless.

### 2.7 Are relationships between individual instances made explicit?

Yes, and they are load-bearing for the statistics.

- **Pairing.** Every prompt exists as an English/Hinglish pair with the same `promptId`. The paired structure is the study's unit of inference.
- **Cells.** The 8 responses sharing a `(promptId, lang, engine)` triple are repetitions of one condition. Comparisons within a cell measure engine noise; comparisons across the language arm of the same prompt and engine measure the language effect.
- **Clustering.** Prompts are clusters and repetitions are within-cluster resamples. Treating the 480 responses as independent observations would badly overstate significance, and the published analysis never does so.
- **Stability linkage.** Each of the 24 held-out responses shares a `(promptId, lang, engine)` triple with a primary cell, which is what makes the drift comparison possible.

### 2.8 Are there recommended data splits?

Yes, and they are already materialized as directories:

- **Primary analysis set:** the 480 files in `data/raw/`, repetitions 1 to 8.
- **Held-out temporal set:** the 24 files in `data/raw-stability/`, repetitions 9 and 10.

Reusers should keep this split. Folding the stability responses into primary aggregates unbalances the design (two prompts would carry 10 repetitions while eight carry 8) and destroys the only out-of-window check the corpus contains.

One archival wrinkle, disclosed for completeness: 24 of the 480 primary files carry `meta.promptsVersion` of `"1.0"` and 456 carry `"1.1"`. The field records the prompt-file version in force at the moment of capture, not a difference in prompt text. Prompt text for those 24 cells is byte-identical between v1.0 and v1.1.

Three fashion prompts, F03, F04, and F05, were rewritten for v1.1. No F04 cells had been collected before the rewrite, so only F03 and F05 required action: five cells in total (`F03_en_gemini_r5`, `F03_en_perplexity_r2`, `F03_hg_perplexity_r4`, `F05_hg_chatgpt_r5`, `F05_hg_perplexity_r1`) were deleted from `data/raw/` before any analysis was run, and re-collected under v1.1. The full account is in `lit-review/prompt-verification.md` and the deviations log in `METHODOLOGY.md`.

### 2.9 Are there errors, sources of noise, or redundancies?

Yes. Named individually:

**Sources of noise inherent to the object of study**

- Engine stochasticity. Two identical prompts to the same engine return different brand sets: within-language brand-set Jaccard is 54.7% on ChatGPT, 51.2% on Gemini, 68.3% on Perplexity. This is the reason the study reports language effects only against a rerun-noise baseline.
- Provider variability. Captures pass through DataForSEO. The corpus records what the provider returned; it cannot distinguish an engine change from a provider capture change.
- Retry effects. 473 of 480 responses succeeded on the first attempt and 7 required a second. The `attempt` field lets reusers exclude or flag retried cells.

**Known annotation defects, found by adversarial verification and fixed**

| Defect | Nature | Fix | Residual risk |
|---|---|---|---|
| Brand "Simple" | Matched the generic English adjective and section headers ("Simple rule:", "Simple choice:"), 35.3% false-positive rate on tagged responses (18 of 51), skewed 14:4 toward the Hinglish arm | `context_regex` requiring skincare context within 80 characters | Tagged responses fell from 51 to 40; the hand audit estimated 33 true positives, so a residual over-count on this one brand is plausible |
| "Lee" vs "Lee Cooper" | 3 responses containing only "Lee Cooper" were double-tagged with both brands | `exclude_following` negative lookahead | Resolved; Lee now 23 responses, Lee Cooper 5 |
| "Asian" | One phantom match from citation anchor text ("Asian skin tones"), which had become that response's `firstBrand` | `context_regex` | Resolved; Asian now 3 responses |
| Answer-language classifier, Hinglish side | Tokens colliding with English words (me, to, hi, na, par, lo, ya, mil) pushed one plain-English answer over the Hinglish threshold | Collision tokens removed from the marker list | One known prior misclassification (`S02_en_chatgpt_r8`) corrected |
| Answer-language classifier, Devanagari side | 5% Devanagari cutoff, computed without stripping URLs, labeled a mixed-script answer as Devanagari | URLs stripped before counting; cutoff raised to 30% of letters | One known prior misclassification (`F02_hg_perplexity_r5`) corrected |

Post-fix, the corpus contains 2,420 (response, brand) pairs across 112 brands. The hand audit of all 26 risky-alias brands found the other 23 clean, including the cases most feared in a Hinglish corpus (Bata, Libas, Soch, Mufti, Killer, Plum, Roadster, Campus, Arrow).

**Redundancy**

`rawApi` duplicates `response.text` and `response.citations`. This is intentional: the extracted fields are convenient, the raw envelope is the auditable record.

### 2.10 Is the dataset self-contained, or does it link to external resources?

The corpus is self-contained. All answer text, citations, metadata, curated tables, and analysis outputs are committed as files. Nothing needs to be fetched at read time.

It does **contain** external references: 4,640 citation URLs across 247 distinct hostnames. Those URLs point to third-party websites that are outside Depra's control and may change, move, or disappear. The corpus does not archive the linked pages, and reusers should not assume a URL in the data still resolves to the content the engine displayed. There are no access restrictions, licenses, or fees attached to the corpus itself.

### 2.11 Does the dataset contain confidential data?

No. All content is machine-generated public-surface output from consumer AI products, captured from logged-out default interfaces. No internal Depra data, no customer data, no credentials. A scan of all 504 raw files for authorization headers or API keys returned only occurrences of the ordinary English word "Basic" inside answer text.

### 2.12 Does the dataset contain data that might be offensive, insulting, threatening, or cause anxiety?

The corpus is product-recommendation text and carries low risk of that kind. Two things reusers should know are present:

- Skin-tone terminology from Indian beauty retail appears in the skincare answers. The term "wheatish" occurs in 8 of the 480 responses. The word "brightening" appears in 44 of 480. Researchers studying colorism in commercial beauty discourse may find this relevant; others should know it is present.
- Answers contain unverified health-adjacent product claims about skincare ingredients, reproduced as the engines wrote them. Nothing in this corpus has been fact-checked for medical accuracy, and it should not be read as such.

### 2.13 Does the dataset identify subpopulations?

Not in terms of people. It identifies **language registers**: each response is tagged `en` or `hg` by prompt condition, and `english`, `hinglish`, or `hindi-devanagari` by answer classification. Hinglish here means one specific register: urban romanized Hindi-English code-mix, English-noun-heavy, at 43% to 69% Hindi-token density per prompt, with no Devanagari in any prompt. Conclusions about "Hinglish" are conclusions about that register.

### 2.14 Is it possible to identify individuals from the data?

No. There are no human subjects. There were no users, no sessions, no accounts, and no personalization. Every call was stateless and logged-out.

### 2.15 Does the dataset contain sensitive personal data?

No. This was verified by scan over all 504 raw files, not asserted:

- **Email addresses.** Exactly one distinct address appears anywhere in the corpus: `customercare@spykar.com`, twice, inside cited content in two ChatGPT responses. It is a clothing brand's published customer-care address, that is, corporate contact information, not personal data.
- **Phone-shaped digit strings.** All 10-to-12-digit runs in the corpus are URL identifiers, not phone numbers: Amazon browse-node IDs in category-listing query strings (`?rh=n:9530424031` and similar) and one blog path segment on `jcsfashions.com`.
- **Names.** Personal names appear only where an engine attributed a cited review or article, which is public authorship information in cited content.

No financial data, government identifiers, health records, biometric data, or location data about any person is present.

---

## 3. Collection process

### 3.1 How was the data acquired?

Directly observed from third-party APIs. Each instance is a machine-generated response, captured as returned. Nothing was self-reported by any person, and nothing was inferred or synthesized.

### 3.2 What mechanisms or procedures were used?

Collection ran through `run-experiment.mjs` (Node.js, committed alongside the data, run under Node v22.11.0), which calls DataForSEO endpoints:

| Engine | Endpoint | Parameters | What it captures |
|---|---|---|---|
| ChatGPT | `chat_gpt/llm_scraper/live/advanced` | `force_web_search: true`, `location_code: 2356` | The chatgpt.com consumer interface in Search mode, with citations, as served to an India-located user |
| Gemini | `gemini/llm_scraper/live/advanced` | `location_code: 2356` | The gemini.google.com consumer interface as served to an India-located user |
| Perplexity | `perplexity/llm_responses/live` | `model: sonar`, `web_search: true`, `web_search_country_iso_code: IN` | Perplexity Sonar with live web search, India market |

ChatGPT and Gemini are consumer-interface captures, not developer-API approximations. Perplexity is the API equivalent of its consumer default model. This is the same capture stack Depra runs in production, which is a source of both convenience and the conflict of interest declared in §1.

Controls applied at collection time:

- Every call India-geolocated.
- Interface-language hint held constant at `en` in both arms, so the only manipulated variable is the prompt text.
- No session carryover, no chat history, no account personalization.
- Execution order a seeded random shuffle (seed 20260814) interleaving prompts, languages, and engines, so no condition is confounded with time within the window.
- Up to 5 attempts per cell with exponential backoff (10s, 30s, 60s, 120s, plus jitter). Empty or sub-40-character answers counted as failures and were retried.
- Full API payload persisted per cell, and every cell logged to `data/run.log`.

Validation: a pilot of one prompt pair across all three engines was run first to confirm parsing before the full sweep. Post-collection validation is described in §4.5.

### 3.3 What was the sampling strategy?

Deterministic and exhaustive within the design frame, not probabilistic. Every cell of the 10 x 2 x 3 x 8 factorial was collected. Prompt selection was purposive: two high-consideration categories where Indian consumers plausibly ask AI for buying advice, five prompts each, spanning distinct subcategories (face wash, sunscreen, vitamin C serum, moisturizer, acne serum; men's jeans, running shoes, women's kurta sets, men's formal shirts, wedding sarees). Prompts were written brand-unaided so that brand mentions measure engine recall rather than prompt echo.

### 3.4 Who was involved in the collection process and how were they compensated?

Depra Research staff designed and ran the collection. No crowdworkers, no annotators outside the team, no human subjects. The only external party is DataForSEO, paid per API call at commercial rates, $2.158731 in total.

### 3.5 Over what timeframe was the data collected?

The primary corpus was captured in a single continuous window on **2026-08-14, 12:25:47Z to 13:22:00Z**, 56 minutes 13 seconds end to end (reported elsewhere in this repository, rounded, as a 57-minute window). Median response latency was 15.7 seconds (minimum 2.6 s, maximum 99.5 s). The 24 stability responses were captured between 13:23:22Z and 13:25:47Z; see §2.2 for how their gap to the matched primary cells should be read.

The creation timeframe matches the timeframe of the phenomenon: these are live engine responses, timestamped at capture.

### 3.6 Were any ethical review processes conducted?

No institutional review board review was sought; there are no human subjects, no personal data, and no intervention on any person. The relevant ethical questions here concern third-party terms of service (see §6.4) and disclosure of commercial interest (see §1), both addressed explicitly.

### 3.7 Was the data collected from individuals directly, or obtained via third parties?

Via a third party (DataForSEO), which captures the engines' public surfaces. Depra did not scrape the engines directly and holds no relationship with OpenAI, Google, or Perplexity.

### 3.8 Notification, consent, and revocation

Not applicable: no individuals are represented in the data, so there was nobody to notify, no consent to obtain, and no consent to revoke.

### 3.9 Has an analysis of potential impact on data subjects been conducted?

Not applicable for data subjects. The parties whose interests are touched are **brands**, whose visibility in AI answers is measured and published. Brand-level figures are aggregate detection rates over 80 responses per engine and language arm, reported with Wilson intervals, derived from a published lexicon, and recomputable from raw text. No brand is characterized qualitatively.

---

## 4. Preprocessing, cleaning, and labeling

### 4.1 Was any preprocessing or labeling done?

Yes. One deterministic pipeline, `analyze.mjs`, reads `data/raw/*.json` plus two curated tables and emits `responses.json` (tidy) and `results.json` (aggregates). Randomness is seeded (seed 20260814, 10,000 bootstrap resamples, 10,000 sensitivity permutations), so reruns are byte-identical.

Three annotation layers are applied. Each is described below with the honest bound on what it can deliver.

### 4.2 Brand extraction

**Construction.** `build-lexicon.mjs` scans all 480 responses and extracts candidate brand strings from markdown bold spans, markdown headers, and capitalized token runs, filtered by a stop list and a minimum of 2 mentions. That produces 2,096 candidates (`lexicon-candidates.json`). A human then curated the entire candidate list, not just the top of it, into `brand-lexicon.json`: 112 product brands, each with alias list, `india_origin` flag, and category. The category split is 36 skincare and 76 fashion. Rule 7 permits a third value, `both`, but no brand in the shipped lexicon carries it. 77 of the 112 are flagged India-origin.

The curation rules are published verbatim inside the lexicon file, in a `curation_rules` array of 8 entries: seven numbered rules plus a closing v1.1 note that records the verification-driven additions. In summary:

1. Product brands only. Retailers and marketplaces (Amazon, Flipkart, Nykaa, Myntra, Ajio, Purplle, Meesho, Tata Cliq) are excluded and tracked separately through citations, with an exception for marketplace house brands that function as product brands (Roadster, HRX, Anouk and similar).
2. Product lines collapse to the parent brand, and aliases include every observed surface form and spelling variant.
3. Ingredients, section headers, fabric types, Hinglish function words, and unattributable fragments are excluded.
4. `india_origin` means founded or headquartered in India; ambiguous cases were checked against a web source recorded in the entry's `verified_via` field.
5. Alias safety, described below.
6. The entire candidate list was worked through, and candidates appearing in only one response were left out. Two different thresholds are in play and should not be confused: `build-lexicon.mjs` emits a candidate only at 2 or more mentions, and curation additionally dropped any candidate that appeared in only one response.
7. Every brand carries a category, one of `skincare`, `fashion`, or `both`.

The eighth entry is the v1.1 note describing `context_regex` and `exclude_following`, added after the verification audit.

**Matching.** Deterministic regex, word-boundary anchored: `(?<![A-Za-z0-9])name(?![A-Za-z0-9])`.

**The risky-alias case-sensitivity rule.** 26 of the 112 brands have names that collide with ordinary English or Hindi words: Arrow, Plum, Simple, Soch, Lee, Libas, Minimalist, Pilgrim, Deconstruct, Hyphen, The Ordinary, Mufti, Killer, Zodiac, Numero Uno, Highlander, Roadster, Sangria, Campus, Asian, Bata, Red Tape, Snitch, Kalki, Banarasee, and W. These are flagged `risky_alias` and matched **case-sensitively** in their listed capitalization, while all other aliases match case-insensitively.

This rule matters more than it sounds. "Bata" is a shoe brand and also the Hinglish verb form in "bata do"; "Libas" is a clothing brand and also the Hindi noun for clothing; "Soch" is a brand and also the Hindi word for "think". Case-insensitive matching would inflate exactly those brands in exactly the Hinglish arm, producing a language-correlated measurement artifact that looks like a finding. The counterfactual was quantified against the shipped v1.1 lexicon: relaxing the rule so that risky aliases match case-insensitively inflates the ChatGPT cross-language brand gap from 2.2 points to 13.7 points, with the exact one-sided p falling to .0010. (`lit-review/verification-log.json` records 13.2 points for the same counterfactual run against the earlier v1.0 lexicon.) **The published convention is the conservative one; it shrinks the reported effect rather than manufacturing it.**

Two further guards were added after verification (lexicon v1.1):

- `context_regex`: the brand counts only if a context pattern appears within 80 characters of the match. Applied to Simple and Asian.
- `exclude_following`: a negative lookahead after the brand name. Applied to Lee, so that "Lee Cooper" does not also tag Lee.

Brand "W" is never matched bare; only through the aliases "W for Woman" and "W for Women".

**Honest bound.** Brand labels are as complete as the lexicon, and the lexicon was built from this corpus. A brand that no engine mentioned in these 480 responses does not exist in the label space. A brand mentioned in only one response was excluded by curation rule 6. This makes the labels reproducible and auditable, and it makes them unsuitable as a general-purpose Indian brand gazetteer. Absence of a brand from a response means "no lexicon alias matched", not "the engine did not mention any such product".

### 4.3 Citation and domain classification

Each citation URL is parsed to its lowercase hostname with `www.` stripped. The corpus contains 4,640 citations across 247 distinct hostnames.

`domain-classes.json` maps observed domains to five named classes, with everything unmatched falling to a sixth bucket, `other`, which is not a key in the file. A domain matches a class if it equals a listed hostname or is a subdomain of one. Every domain with 10 or more citations is explicitly classified; the long tail is `other`.

| Class | Definition | Examples in the table |
|---|---|---|
| `marketplace` | Multi-brand commerce | amazon.in, flipkart.com, nykaa.com, myntra.com, ajio.com, purplle.com, tatacliq.com |
| `brand-site` | A single product brand's own site | thedermaco.com, beminimalist.co, plumgoodness.com, libas.in, nike.com |
| `publisher` | Editorial, news, review, or blog content | hindustantimes.com, vogue.in, idiva.com, healthshots.com, medium.com |
| `social` | User-generated-content platforms | youtube.com, reddit.com, instagram.com, quora.com |
| `health-pharma` | Medical and pharmacy content | netmeds.com, apollopharmacy.in, pharmeasy.in, mrmed.in |
| `other` | Anything unmatched | (long tail) |

Two conventions that change numbers if a reuser assumes differently:

- **`nykaaCited` tests the parsed hostname, not the whole URL.** `analyze.mjs` extracts each citation's hostname and asks whether that hostname contains the substring `nykaa`, which in this corpus means nykaa.com, nykaafashion.com, or nykaaman.com. The distinction is load-bearing: several cited pages carry `#:~:text=` scroll-to-text fragments containing the word "nykaa", and a naive whole-URL substring test counts those, moving Gemini's cited-Nykaa rate from 15/80 to 17/80 on the English arm and 6/80 to 7/80 on the Hinglish arm.
- **`citationDomains` is a set of distinct hostnames** per response, while `nCitations` counts citations. A response citing amazon.in five times contributes one domain and five citations.

**Honest bound.** These are **displayed sources**, not verified evidence provenance. The corpus records which URLs an engine showed next to its answer. It does not record whether those pages support the sentences they are attached to. Prior work (Liu et al., Findings of EMNLP 2023, summarized in `lit-review/LIT-REVIEW.md`, which puts the support rate at 74.5%) finds roughly a quarter of generative-engine citations fail to support the sentence they are attached to. Nothing in this corpus contradicts or confirms that; it simply does not measure it.

### 4.4 Answer-language classification

A rule-based three-way classifier, published in `analyze.mjs`:

1. Strip URLs first, both markdown-parenthesized and bare. Citation links inflate the Latin-letter count and can mask a Devanagari answer.
2. If Devanagari letters exceed 30% of all Devanagari-plus-Latin letters, label `hindi-devanagari`.
3. Otherwise tokenize to lowercase alphabetic tokens and count matches against a fixed 70-token romanized-Hindi function-word list (hai, hain, ke, ki, ka, ko, se, mein, liye, aur, wala, nahi, aap, chahiye, konsa, kyun and similar). Label `hinglish` if the marker ratio is at least 2% **and** at least 3 distinct markers appear. Otherwise `english`.

Both thresholds and the marker list are v1.1, revised after verification found the earlier version misfiring in both directions (see the defect table in §2.9).

**Validation.** An independent reviewer, blind to the classifier code, judged a stratified random sample of 30 responses (5 per engine-by-prompt-language cell, seeded) and agreed with the label in 30 of 30 cases. A separate script-level scan of all 480 texts reproduced the Devanagari set one for one.

**Resulting distribution** (this is a finding, not just metadata):

| Engine | English prompts | Hinglish prompts |
|---|---|---|
| ChatGPT | 80 english | 80 hinglish |
| Gemini | 80 english | 71 hinglish, 8 hindi-devanagari, 1 english |
| Perplexity | 80 english | 80 hinglish |

**Honest bound.** This is a threshold rule over a hand-built word list, not a trained language identifier. It has no confidence score and no calibration. It is published because it is auditable, and because code-mix detection has no off-the-shelf tool whose behavior on this register is known.

### 4.5 What was verified, and what did verification find?

Four independent passes, all documented:

1. **Pre-analysis prompt review** (`lit-review/prompt-verification.md`). An independent reviewer checked all 10 pairs for naturalness, semantic equivalence, and purchase intent before any analysis. Three fashion pairs failed: F03 was double-barreled and let retailer recall contaminate brand recall, F04 lacked an explicit purchase verb, F05 was missing the India anchor in its English version (a market-signal confound perfectly correlated with language) and had a plural mismatch. All three were rewritten to the reviewer's fixes, producing prompts v1.1. F04 had produced no cells at the time of the rewrite, so only the five already-collected F03 and F05 cells needed deletion and re-collection (see §2.8).
2. **Adversarial recomputation** (`lit-review/verification-log.json`). Six independent agents, none with access to `analyze.mjs`, recomputed headline numbers straight from `data/raw/`. All six reproduced. Zero refuted. Reproductions matched to six decimal places on India-origin shares and exactly on Wilson intervals and permutation counts.
3. **Instrument defects found by that pass.** Five, all listed in §2.9, all fixed, with the full pipeline re-run afterward. Effect on headlines: ChatGPT brand gap 2.1 to 2.2 points, Gemini 7.9 to 7.8, Perplexity 23.8 to 23.4. The same pass flagged that a top-up collection job was writing files into `data/raw/` while verification was in progress; the dataset was frozen at repetitions 1 to 8 and the extra repetitions were moved to `data/raw-stability/`, as described in §2.2.
4. **Temporal stability rerun** (`data/analysis/stability.json`). The direction holds on all three engines in the later window: fresh within-language brand-set overlap sits above fresh cross-language overlap on ChatGPT (48.0% vs 43.8%), Gemini (65.1% vs 61.1%), and Perplexity (83.3% vs 66.8%).

**Reading the drift ratios correctly.** `stability.json` reports a `driftRatio` per engine of 0.91 (ChatGPT), 1.05 (Gemini), and 1.04 (Perplexity). That ratio is `freshVsPrimarySameLang` divided by `primaryWithinLang`, and both terms are restricted to the two rerun prompts, S01 and F02. The restricted `primaryWithinLang` baselines are ChatGPT 49.5%, Gemini 50.3%, Perplexity 78.1%.

**These restricted baselines cover S01 and F02 only. They are not comparable to the corpus-wide within-language figures of 54.7%, 51.2%, and 68.3%, and dividing the fresh overlaps by those corpus-wide numbers does not reproduce the published ratios.** Any reuser recomputing drift must restrict the primary side to the same two prompts.

**Fragility that survives into the published results and should travel with the data: the ChatGPT effect is marginal.** Its exact one-sided permutation p is .046 and the two-sided equivalent is .092. The effect is concentrated in one category: pooling the five skincare prompts gives a mean delta of 4.45 points (exact one-sided p = .063), while the five fashion prompts give 0.01 points (p = .469). Four of the ten per-prompt deltas in `results.json` are negative (three fashion, one skincare). The correct reading of ChatGPT in this corpus is "approximately language-invariant", not "a small but real effect".

Four of the ten per-prompt deltas are negative (`rq1_brands.signFlipExact.chatgpt.pooled.perPromptDeltas`). An earlier draft of `REPORT.md` said three, a count carried over from the pre-correction verification pass; it was corrected before release. `results.json` is the source of record.

### 4.6 Was the raw data saved in addition to the preprocessed data?

Yes. Every raw API payload is committed, unmodified, in `data/raw/` and `data/raw-stability/`. The tidy and aggregate files are fully derivable from them.

### 4.7 Is the preprocessing software available?

Yes, all of it, in the repository root: `run-experiment.mjs` (collection), `build-lexicon.mjs` (candidate extraction), `analyze.mjs` (tidy plus statistics), `stability-check.mjs` (temporal comparison). Node.js only, no external dependencies for the analysis path. Reproduction:

```
node analyze.mjs
shasum -a 256 data/analysis/results.json
# expect a1afac1d716bf845fdee2d31941b672c1e728d44e459eac13c854740a12203e2
```

`data/analysis/results.sha256` holds that same digest as a bare 64-character hex string with no filename field, so `cat data/analysis/results.sha256` prints the digest alone.

Re-collection with `run-experiment.mjs` requires DataForSEO credentials and will not reproduce the original responses, because the engines are stochastic and have moved on.

---

## 5. Uses

### 5.1 Has the dataset been used for any tasks already?

Yes, for one: the study report `REPORT.md` (v1.0), "Same question, different brands: what happens when Indian shoppers ask AI in Hinglish instead of English". Its headline results:

| Engine | Brand-set Jaccard, within-language | Cross-language | Gap | 95% CI | Exact one-sided p |
|---|---|---|---|---|---|
| ChatGPT † | 54.7% | 52.5% | 2.2 pts | [0.3, 4.6] | .046 |
| Gemini | 51.2% | 43.3% | 7.8 pts | [2.6, 13.9] | .0098 |
| Perplexity | 68.3% | 44.9% | 23.4 pts | [12.9, 35.1] | .0010 |

† The equivalent two-sided p is .092. Read ChatGPT as approximately language-invariant; see §4.5.

Cited-domain gaps run 3.1 points (ChatGPT, p = .033), 22.3 points (Gemini, p = .0098), 32.4 points (Perplexity, p = .0010).

Citation presence splits the engines sharply. Reported as counts out of the 80 responses in each cell (`rq2_citations.hasCitations`):

| Engine | English answers with at least one citation | Hinglish |
|---|---|---|
| ChatGPT | 80/80 | 80/80 |
| Gemini | 72/80 (90.0%) | 33/80 (41.3%) |
| Perplexity | 80/80 | 80/80 |

Only Gemini changes. Alongside the citation collapse, its mean citations fall from 9.4 to 5.2 and its answers run 33% shorter (4,609 to 3,099 characters). India-origin brand share moves modestly on all three engines: ChatGPT 74.4% to 74.7%, Gemini 75.6% to 82.0%, Perplexity 63.7% to 66.3%.

### 5.2 Is there a repository linking to papers or systems that use the dataset?

Not yet. The repository at https://github.com/ifham001/IndicGEO is the canonical location and will list downstream work as it appears. Notification of reuse to team@depra.ai is welcome and will be linked.

### 5.3 Recommended uses

- **Replication and re-analysis.** Recompute the published statistics, or apply different estimators to the same tidy data. The paired-prompt structure supports alternatives to sign-flip permutation.
- **Methodological work on GEO measurement.** The corpus contains an explicit rerun-noise baseline, which makes it usable for studying how much apparent "effect" in AI-visibility measurement is engine stochasticity.
- **Code-mix NLP evaluation.** 240 responses to Hinglish prompts (231 classified `hinglish`, 8 `hindi-devanagari`, 1 `english`), carrying rule-based language labels that an independent reviewer validated on a stratified sample of 30, at a documented code-mix density, in a commercial domain rather than the social-media text that dominates code-mix corpora.
- **Citation-behavior research.** 4,640 displayed citations across 247 hostnames, with class labels, split by engine and prompt language.
- **Baseline for a later wave.** The prompts are frozen at v1.1 precisely so a future capture can be compared against this one. That comparison is the intended longitudinal use.
- **Teaching material.** The corpus ships a frozen pre-analysis plan, a deviations log, an adversarial verification record that found real defects, and a byte-reproducible pipeline. It works as a worked example of measurement design under a declared conflict of interest.

### 5.4 Uses we caution against

- **Do not read brand visibility as market share, sales, or consumer preference.** These are AI answer-detection rates on 10 prompts in one hour. Minimalist appearing in 27 of the 80 Perplexity Hinglish responses (33.8%) has a 33.8% detection rate on this prompt set, nothing more. Quote these figures with the count attached, because a rounded percentage hides how few responses sit behind it.
- **Do not generalize to all Indian buying queries.** Two categories, ten prompts, one register. Prompt classes not represented here (electronics, services, local search, comparison shopping, low-consideration purchases) are outside the frame, and the corpus provides no basis for extrapolating to them.
- **Do not use it as a current snapshot of engine behavior.** The data describes 2026-08-14. Engines, retrieval indexes, and commercial integrations change. Any use of these numbers to describe engine behavior at a later date is an error, and the further from the fieldwork date, the larger the error. If you need current behavior, re-run the prompts.
- **Do not treat the ChatGPT result as a demonstrated language effect.** Marginal one-sided p, non-significant two-sided, four of ten deltas negative, and a category split in which fashion contributes essentially nothing. Report it as approximate language invariance.
- **Do not treat citations as evidence provenance.** They are displayed sources. Building a claim about whether AI answers are well-supported requires checking the cited pages, which this corpus does not do.
- **Do not read the effect-size differences as evidence about retrieval.** The design does not separate retrieval from generation, and nothing here can attribute an engine's language sensitivity to one or the other.
- **Do not use the brand lexicon as a general Indian brand list.** It is a corpus-bounded artifact: 112 brands that these engines named in these 480 responses, with single-response candidates deliberately excluded.
- **Do not pool engines.** Cross-engine agreement on top brands is low, engine behaviors differ in direction and size, and the published analysis never pools. Pooled numbers from this data would be uninterpretable averages of different phenomena.
- **Do not treat it as evidence about signed-in or personalized experiences.** All captures are logged-out default surfaces with no history.
- **Do not train a brand-recognition or language-identification model on it and expect it to transfer.** 480 documents from three generators in two product categories is a narrow distribution, and the labels come from the same rules you would be trying to learn.

### 5.5 Is there anything about the composition or collection that could impact future uses?

Yes, and reusers should carry these forward:

- **Funder interest.** Depra sells AI-visibility tracking and benefits commercially from the conclusion that English-only measurement is insufficient. Every input needed to check the conclusion is published, but the incentive is real and should be stated wherever the data is reused.
- **Capture-stack coupling.** The collection stack is Depra's production stack. A systematic quirk in how DataForSEO renders these interfaces would appear in the data as engine behavior, and this corpus cannot separate the two.
- **Lexicon-bounded labels.** As above: the label space is closed and corpus-derived.
- **Register monoculture.** One Hinglish register. Devanagari Hindi, heavier-Hindi registers, and other Indian languages are absent. Findings labeled "Hinglish" mean this register.
- **Single window.** Every temporal claim reduces to the 56-minute primary window plus the short stability check described in §2.2.
- **Small prompt N.** Ten clusters. Exact permutation tests handle that honestly, but they cannot make ten prompts into a wide sample. Confidence intervals in `results.json` are the right guide to what the data can carry.
- **Jaccard conventions.** Two empty brand sets score 1 (identical silence), one empty against one non-empty scores 0. Reusers computing their own overlap should either adopt the convention or state a different one.

### 5.6 Are there tasks for which the dataset should not be used?

Do not use it to make claims about individual people, to rank brands commercially as if these were market data, to assert facts about product efficacy or safety (the answer text contains unverified marketing and health-adjacent claims), or as a source of ground truth about which web pages support which statements.

---

## 6. Distribution

### 6.1 Will the dataset be distributed to third parties?

Yes. It is public and open, published as part of the IndicGEO research program at https://github.com/ifham001/IndicGEO.

### 6.2 How will it be distributed?

As a git repository containing plain files: JSON for data, Markdown for documents, JavaScript modules for code. No database, no API, no registration, no download gate. There is no DOI at v1.0; the commit hash plus the `results.json` SHA-256 serve as the version identifier.

### 6.3 When will it be distributed?

With the release of study report v1.0, dated 2026-08-14.

### 6.4 Licensing and terms of use

- **Code** (`run-experiment.mjs`, `build-lexicon.mjs`, `analyze.mjs`, `stability-check.mjs`): MIT, see `LICENSE`.
- **Data and text** (everything under `data/`, including `data/README.md`, plus `prompts.json`, `REPORT.md`, `METHODOLOGY.md`, `DATASHEET.md`, and `lit-review/`): CC BY 4.0, see `LICENSE-DATA`. Attribute to Depra Research, 2026. Citation metadata is in `CITATION.cff`.

Third-party content, stated for reusers to assess for themselves: the corpus contains machine-generated output from ChatGPT, Gemini, and Perplexity, captured through DataForSEO, reproduced for research on those systems. Depra makes no copyright claim over model output and does not purport to license it beyond that. Brand names, domain names, and cited URLs belong to their owners. Anyone redistributing or building on the corpus should form their own view of the relevant providers' terms.

### 6.5 Have any third parties imposed IP-based or other restrictions?

No restriction has been imposed on this dataset by any third party. We are not aware of any export-control or regulatory restrictions applying to this corpus.

---

## 7. Maintenance

**Who maintains the dataset?**

Depra Research. Contact: team@depra.ai.

**Will the dataset be updated?**

The v1.0 corpus is frozen. It will not be edited, because it is the evidentiary record behind a published report and because its checksum is public. Corrections are handled as errata, not silent edits (below).

Future waves are the intended path forward. The prompt set is frozen at v1.1 for exactly that reason: a later capture using identical prompts and the same pipeline produces a comparable wave rather than an incomparable new study. Candidate directions named in the report: other Indian languages and registers, Devanagari Hindi, additional categories, and repeated windows for longitudinal drift.

**How will errata be communicated?**

Through the repository. Any defect found after publication will be recorded in the deviations log in `METHODOLOGY.md`, with the discovery date, the defect, the fix, and the effect on published numbers, exactly as the five verification-driven fixes are recorded now. If a correction changes `results.json`, the published SHA-256 in `data/analysis/results.sha256` and in the report changes with it, and the change is stated in the log. Material corrections will be announced in the repository README.

**Will older versions be supported?**

Git history preserves every version. v1.0 remains retrievable by commit hash regardless of later waves. Because `analyze.mjs` is byte-reproducible, any historical version can be re-verified against its own recorded digest.

**Is there a retention limit?**

No. The corpus is intended to remain published indefinitely.

**Can others extend, build on, or contribute?**

Yes. The license permits reuse with attribution. Contributions that fit the program: additional prompt pairs in other Indian languages or registers, independent replications in later windows, alternative statistical treatments of the same tidy data, and corrections to the brand lexicon or domain-class table with evidence. Send them to team@depra.ai or open an issue in the repository. Independent recomputation that contradicts a published number is the most useful contribution available, and defects found that way will be logged and credited.

---

## Appendix: quick reference

**Reproduce the analysis**

```
node analyze.mjs
shasum -a 256 data/analysis/results.json
# a1afac1d716bf845fdee2d31941b672c1e728d44e459eac13c854740a12203e2
```

**Corpus at a glance**

| Quantity | Value |
|---|---|
| Primary responses | 480 (60 balanced cells of 8) |
| Held-out stability responses | 24 |
| Prompt pairs | 10 (5 skincare, 5 fashion), frozen v1.1 |
| Engines | ChatGPT, Gemini, Perplexity, all India-geolocated |
| Fieldwork window | 2026-08-14, 12:25:47Z to 13:22:00Z (56 minutes 13 seconds) |
| First-attempt success | 473 of 480; 7 succeeded on attempt 2; 0 permanent failures |
| Brands in lexicon | 112 (77 India-origin, 26 risky-alias, 36 skincare and 76 fashion, none `both`) |
| Brand mention pairs | 2,420 |
| Responses with no brand match | 4 |
| Responses with no citations | 55 |
| Citations | 4,640 across 247 distinct hostnames |
| Domain classes | 6 (marketplace, brand-site, publisher, social, health-pharma, other) |
| Answer-language labels | 241 english, 231 hinglish, 8 hindi-devanagari (the 241st English label is one Gemini answer to a Hinglish prompt) |
| Total collection cost | $2.158731 (ChatGPT $0.6400, Gemini $0.6400, Perplexity $0.8787) |
| Analysis seed | 20260814 (10,000 bootstrap, 10,000 sensitivity permutations, 1,024 exact sign flips) |
