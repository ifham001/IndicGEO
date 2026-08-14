# Data dictionary and quickstart

This file lives at `data/README.md`. It is the working guide to the Study 01 corpus: what each file contains, what every field means, and copy-pasteable code to get answers out of it. For the research design read `../METHODOLOGY.md`; for the findings read `../REPORT.md`; for dataset provenance, ethics, and licensing read `../DATASHEET.md`.

Everything under `data/`, including this file, is released under CC BY 4.0 (see `../LICENSE-DATA`). The analysis scripts are MIT (see `../LICENSE`). Attribution: Depra Research, 2026.

All paths below are relative to the repository root, which is also where the recipes expect to be run from.

## Layout

| Path | What it is |
| --- | --- |
| `data/raw/` | 480 primary responses, one JSON file per cell, 13 MB. Full unmodified API payload included. |
| `data/raw-stability/` | 24 responses from the temporal stability rerun, captured after the primary window closed. Held out of the primary analysis. Same file schema. |
| `data/run.log` | Timestamped fieldwork log written by `run-experiment.mjs`, 1,039 lines: one line per collected cell, plus run start, progress, and completion markers. Also listed in `../DATASHEET.md` §2.4. |
| `data/README.md` | This file. |
| `data/analysis/responses.json` | Tidy corpus, one row per response, 480 rows. Start here. |
| `data/analysis/results.json` | Every computed statistic in the report. |
| `data/analysis/results.sha256` | Expected digest of `results.json`: the bare 64-character hex string, no filename field. |
| `data/analysis/brand-lexicon.json` | The 112-brand matching lexicon (v1.1) plus the curation rules it was built under. |
| `data/analysis/domain-classes.json` | Citation domain classification used for `domainClassCounts` and `domainClassMix`. |
| `data/analysis/lexicon-candidates.json` | Raw brand-candidate extraction from `build-lexicon.mjs`, before human curation, 2,096 candidates. Provenance, not analysis input. |
| `data/analysis/stability.json` | Output of `stability-check.mjs`. |

`responses.json`, `results.json`, `stability.json` and `lexicon-candidates.json` are all derived. `raw/`, `raw-stability/`, `brand-lexicon.json` and `domain-classes.json` are the inputs.

## Raw file naming

```
data/raw/<promptId>_<lang>_<engine>_r<rep>.json
```

| Part | Values |
| --- | --- |
| `promptId` | `S01`..`S05` (skincare), `F01`..`F05` (fashion). Same id means the same EN/HG prompt pair in `../prompts.json`. |
| `lang` | `en` or `hg`. `hg` is romanized Hinglish. |
| `engine` | `chatgpt`, `gemini`, `perplexity`. |
| `rep` | `1`..`8` in `data/raw/`. The stability rerun uses `9` and `10` and lives in `data/raw-stability/`. |

So the full grid is 10 prompts x 2 languages x 3 engines x 8 reps = 480. Parsing the name in Node:

```js
const [promptId, lang, engine, rep] = 'S03_hg_perplexity_r7'.split('_');
const repNum = Number(rep.slice(1)); // 7
```

The same string is stored as `meta.cellId`, so you rarely need to parse the filename. Every field in the name is also a top-level field in the tidy file.

## Raw file schema

Three top-level keys: `meta`, `response`, `rawApi`.

### `meta`

| Field | Type | Meaning |
| --- | --- | --- |
| `study` | string | Always `"hinglish-geo-study"`. |
| `promptsVersion` | string | Version of `prompts.json` in force when this cell was collected. 456 files say `"1.1"`, 24 say `"1.0"`. See the note below. |
| `promptId` | string | `S01`..`F05`. |
| `category` | string | `"skincare"` or `"fashion"`. |
| `lang` | string | `"en"` or `"hg"`. |
| `engine` | string | `"chatgpt"`, `"gemini"`, `"perplexity"`. |
| `rep` | number | Repetition index. |
| `promptText` | string | The exact text sent to the engine. |
| `cellId` | string | `<promptId>_<lang>_<engine>_r<rep>`. Unique across the corpus. |
| `startedAt` | ISO string | UTC request start. |
| `finishedAt` | ISO string | UTC request finish. |
| `durationMs` | number | Wall-clock request duration. |
| `attempt` | number | Which attempt succeeded. `1` for 473 of the 480 responses; 7 succeeded on attempt 2; the observed maximum in the corpus is 2, though the runner permitted up to 5. |
| `attemptsLog` | array | Failed attempts before the successful one, empty for the 473 first-attempt cells. |
| `locationCode` | number | DataForSEO location code, `2356` (India) throughout. |
| `countryIso` | string | `"IN"` throughout. |

About `promptsVersion`: the prompt set was revised from v1.0 to v1.1 during early fieldwork, before any analysis, after the independent equivalence review failed three fashion pairs. All three (F03, F04, F05) were rewritten. F04 had produced no cells at that point, so only the five already-collected F03 and F05 cells were deleted and recollected. The 24 files still stamped `"1.0"` carry prompt text that is byte-identical in v1.0 and v1.1, so the corpus is homogeneous. Details are in `../lit-review/prompt-verification.md` and the deviations log in `../METHODOLOGY.md`.

### `response`

| Field | Type | Meaning |
| --- | --- | --- |
| `text` | string | The answer as markdown, exactly as returned. This is the only text the analysis reads. |
| `citations` | array | Sources the engine displayed with the answer, in display order. Can be empty (Gemini Hinglish frequently returns none). |
| `citations[].url` | string | Absolute URL. Present on all 4,640 citations in the corpus. ChatGPT URLs carry a `utm_source=chatgpt.com` parameter; all 160 ChatGPT responses contain at least one such URL. |
| `citations[].source_name` | string, optional | Publisher label when the engine supplies one. Present on 1,483 of the 4,640 citations: ChatGPT 408 of 408, Gemini 1,075 of 1,164, Perplexity 0 of 3,068. |
| `citations[].position` | number | 1-based display position. |
| `costUsd` | number | API cost of this single call. |

### `rawApi`

The complete unmodified DataForSEO response envelope: `version`, `status_code`, `status_message`, `time`, `cost`, `tasks_count`, `tasks_error`, `tasks`. The interesting payload is `rawApi.tasks[0].result[0]`, and its shape differs by engine because the endpoints differ.

- ChatGPT (`chat_gpt/llm_scraper/live/advanced`): `keyword`, `location_code`, `language_code`, `model`, `check_url`, `datetime`, `markdown`, `search_results`, `sources`, `fan_out_queries`, `brand_entities`, `se_results_count`, `item_types`, `items_count`, `items`.
- Gemini (`gemini/llm_scraper/live/advanced`): same minus `check_url`, `search_results`, `fan_out_queries` and `brand_entities`.
- Perplexity (`perplexity/llm_responses/live`): `model_name`, `input_tokens`, `output_tokens`, `reasoning_tokens`, `web_search`, `money_spent`, `datetime`, `items`, `fan_out_queries`.

`rawApi` is preserved so you can rebuild `response` differently, or mine fields the study did not use (fan-out queries, token counts, ChatGPT's `brand_entities`). Nothing downstream depends on it.

## `data/analysis/responses.json`

A JSON array of 480 objects, one per response, written by `analyze.mjs` from `data/raw/`. This is the file to load for almost any secondary analysis. Fields are listed in the order `analyze.mjs` emits them, matching `../DATASHEET.md` §2.4, so the two tables can be diffed against the file.

| Field | Type | Meaning |
| --- | --- | --- |
| `cellId` | string | Matches the raw filename stem. |
| `promptId` | string | `S01`..`F05`. |
| `category` | string | `"skincare"` or `"fashion"`. |
| `lang` | string | `"en"` or `"hg"`. |
| `engine` | string | `"chatgpt"`, `"gemini"`, `"perplexity"`. |
| `rep` | number | 1 to 8. |
| `startedAt` | ISO string | Copied from `meta`. |
| `durationMs` | number | Copied from `meta`. |
| `attempt` | number | Copied from `meta`. |
| `textLength` | number | Characters in `response.text`. |
| `answerLanguage` | string | `"english"`, `"hinglish"` or `"hindi-devanagari"`, from the classifier in `analyze.mjs`. URLs are stripped first; more than 30% Devanagari letters classifies as `hindi-devanagari`, otherwise a hit rate of at least 2% against a 70-token romanized-Hindi marker list, with at least 3 distinct markers, classifies as `hinglish`. |
| `brands` | string[] | Canonical brand names matched in the answer, ordered by first character offset. Deduplicated: a brand appears at most once regardless of how often it is mentioned. |
| `firstBrand` | string or null | `brands[0]`, or null if no brand matched. |
| `top3Brands` | string[] | First three entries of `brands`. Shorter if fewer matched. |
| `nykaaInText` | boolean | Word-boundary match on "nykaa" anywhere in the answer text, case-insensitive. |
| `nykaaCited` | boolean | At least one citation whose **parsed hostname** contains "nykaa". The test runs on the hostname, not the full URL, so a page whose `#:~:text=` fragment mentions Nykaa does not count. |
| `indiaOriginShare` | number or null | Share of `brands` with `india_origin: true`. Null when `brands` is empty (4 rows). |
| `nCitations` | number | Length of `response.citations`, counting duplicates. |
| `citationDomains` | string[] | Distinct hostnames from the citation URLs, lowercased, `www.` stripped, in first-appearance order. Shorter than `nCitations` whenever an engine cites one domain repeatedly. |
| `domainClassCounts` | object | Counts of `citationDomains` per class: `marketplace`, `brand-site`, `publisher`, `social`, `health-pharma`, `other`. Classes with zero are omitted. |
| `inTldShare` | number or null | Share of `citationDomains` ending in `.in`. Null when there are no citations (55 rows). |
| `costUsd` | number | Copied from `response.costUsd`. |

Two things to watch. `citationDomains` is deduplicated per response, so summing it across the corpus gives "responses citing this domain", not "times this domain was cited". And `indiaOriginShare` and `inTldShare` are nullable, so filter before averaging.

## `data/analysis/results.json`

Every number in the report. Top level:

| Key | Value |
| --- | --- |
| `nResponses` | `480`. |
| `seed` | `20260814`. |
| `nBoot` | `10000`, clustered bootstrap resamples over prompts. |
| `nPerm` | `10000`, sampled permutations for the sensitivity check. |
| `counts` | `engine -> lang -> n`. All six cells (3 engines x 2 languages) are 80. |
| `totalCostUsd` | `2.158731000000001`. |
| `rq1_brands` | Which brands get recommended. |
| `rq2_citations` | Which sources get cited. |
| `rq3_answerLanguage` | What language the answer comes back in. |
| `responseLength` | Answer length in characters. |

Engines are never pooled. Every block below is keyed by engine first.

### `rq1_brands`

| Key | Shape and meaning |
| --- | --- |
| `visibility` | `engine -> lang -> brand -> { k, n, p, lo, hi }`. Share of the 80 responses in that cell mentioning the brand, with a Wilson 95% score interval. `lo` and `hi` are proportions, not percentages. Only brands actually observed in that cell are present, so a lookup can return `undefined`; treat that as `k = 0`. |
| `top3Visibility` | Same shape, but a brand counts only when it is in `top3Brands`, and only brands that reached the top three at least once in that cell appear as keys. |
| `overlap` | `engine -> { meanWithinLangJaccard, meanCrossLangJaccard, delta, deltaCI95, nWithinPairs, nCrossPairs }`. Jaccard similarity of brand sets between response pairs. Within-language pairs are the rerun baseline (560 pairs), cross-language pairs are the comparison (640). `delta` is within minus cross, `deltaCI95` is a `[lo, hi]` clustered bootstrap interval over prompts. |
| `signFlipExact` | `engine -> { pooled, skincare, fashion } -> { nPrompts, perPromptDeltas, observedMeanDelta, exactP }`. The primary inference: an exact paired sign-flip permutation test enumerating all 2^nPrompts sign patterns. `exactP` under `pooled` is the p-value quoted in the report. |
| `permutationSensitivity` | `engine -> { observedDelta, pValue }`. A sampled permutation check run alongside the exact test, with `nPerm` draws, so `pValue` floors at 1/(nPerm+1) = 0.0000999. Not the headline test. |
| `firstMentionAgreement` | `engine -> { within, cross } -> { p, lo, hi }`. Probability that two responses name the same brand first, Wilson interval. |
| `indiaOriginShare` | `engine -> lang -> { mean, n }`. Mean of the non-null per-response `indiaOriginShare`, so `n` can be below 80. |
| `brandsPerResponse` | `engine -> lang -> { mean, n }`. |
| `nykaaIntegrationFlag` | `engine -> lang -> { inText: { p, lo, hi }, cited: { p, lo, hi } }`. |

### `rq2_citations`

| Key | Shape and meaning |
| --- | --- |
| `hasCitations` | `engine -> lang -> { k, n, p, lo, hi }`. Share of responses with at least one citation. ChatGPT and Perplexity are at 80/80 in both arms. This is where the Gemini collapse shows up: 72/80 English against 33/80 Hinglish. |
| `meanCitations` | `engine -> lang -> { mean, n }`. Mean of `nCitations`, duplicates included. |
| `overlap` | Same shape as `rq1_brands.overlap`, computed over `citationDomains` sets instead of brand sets. |
| `signFlipExact` | Same shape as `rq1_brands.signFlipExact`, over domain sets. |
| `permutationSensitivity` | Same shape as `rq1_brands.permutationSensitivity`, over domain sets. |
| `inTldShare` | `engine -> lang -> { mean, n }`. Mean of the non-null per-response `inTldShare`, so `n` drops to 72 for Gemini English and 33 for Gemini Hinglish. |
| `domainClassMix` | `engine -> lang -> class -> count`. Sum of `domainClassCounts` across the cell, so the unit is distinct-domain-per-response, not citations. |

### `rq3_answerLanguage` and `responseLength`

`rq3_answerLanguage` is `engine -> lang -> answerLanguage -> count`, counts summing to 80 per cell. Language values with a count of zero are omitted, so ChatGPT English is simply `{ english: 80 }`. `responseLength` is `engine -> lang -> { mean, n }` in characters.

### Reproducing it

`analyze.mjs` is deterministic and its output is byte-reproducible:

```bash
node analyze.mjs
shasum -a 256 data/analysis/results.json
# a1afac1d716bf845fdee2d31941b672c1e728d44e459eac13c854740a12203e2
```

The same digest is in `data/analysis/results.sha256`, stored as the bare hex string with nothing else, so `cat data/analysis/results.sha256` prints exactly the line above without the filename. Note that rerunning `analyze.mjs` also rewrites `data/analysis/responses.json`.

## `data/analysis/brand-lexicon.json`

Three top-level keys: `version` (`"1.1"`), `curation_rules`, and `brands`, an array of 112 entries.

`curation_rules` is an array of 8 strings: seven numbered rules the lexicon was built under, plus a closing v1.1 note recording the verification-driven additions. Read them before you trust a brand count.

| Field | Type | Meaning |
| --- | --- | --- |
| `canonical` | string | The name used everywhere downstream. `brands`, `firstBrand`, `top3Brands` and every key in `visibility` are canonical names. |
| `aliases` | string[] | Other observed surface forms, including punctuation and spelling variants. May be empty. Product lines are folded into the parent brand. |
| `india_origin` | boolean | Founded or headquartered in India. True on 77 of the 112 entries. Drives `indiaOriginShare`. Ambiguous cases carry a `verified_via` URL. |
| `category` | string | Rule 7 permits `"skincare"`, `"fashion"` or `"both"`. In the shipped lexicon only two occur: 36 skincare and 76 fashion. No entry carries `"both"`. |
| `risky_alias` | boolean, optional | True on 26 entries whose name collides with an ordinary word or another brand. See the matching note below. |
| `note` | string, optional | Why the entry is tricky and what was done about it. Present on 51 entries. |
| `verified_via` | string, optional | Source URL for a contested origin call. Present on 10 entries. |
| `context_regex` | string, optional | Present on `Simple` and `Asian`. |
| `exclude_following` | string, optional | Present on `Lee`. |

Matching rules as implemented in `analyze.mjs`:

- Each of `canonical` and every alias becomes a word-boundary regex: `(?<![A-Za-z0-9])NAME(?![A-Za-z0-9])`.
- `risky_alias: true` makes matching **case-sensitive**, everything else matches case-insensitively. This is what stops "simple" the adjective from counting as Simple the brand. The rule is load-bearing in the conservative direction: relaxing it to case-insensitive inflates the ChatGPT cross-language brand gap from 2.2 points to 13.7 points.
- `context_regex` requires the pattern to appear within 80 characters either side of the match, otherwise the match is discarded. `Simple` requires a skincare word (`skin|cleanser|face|facial|kind|refreshing|micellar|moistur|wash`), `Asian` requires a footwear word (`shoe|sneaker|running|footwear|sports`). Both were added in v1.1 after the adversarial verification pass measured a 35.3% false-positive rate on `Simple` (18 phantoms in 51 tagged responses).
- `exclude_following` appends a negative lookahead after the name. `Lee` carries `\s+Cooper` so a response that only names Lee Cooper is not also tagged as Lee.
- Retailers and marketplaces are deliberately absent from the lexicon. Nykaa, Amazon, Flipkart, Myntra and the rest are tracked through citations and the Nykaa flags, not as brands. Marketplace house brands that are genuine product brands (Roadster, HRX, Anouk and similar) are included.

## `data/analysis/domain-classes.json`

Keys: `version`, `note`, `classes`. `classes` maps a class name to an array of hostnames:

| Class | Contents |
| --- | --- |
| `marketplace` | Multi-brand commerce: amazon.in, flipkart.com, nykaa.com, myntra.com, ajio.com and similar. |
| `brand-site` | A single product brand's own site: thedermaco.com, plumgoodness.com, levi.in and similar. |
| `publisher` | Editorial, news, review and blog content: hindustantimes.com, vogue.in, idiva.com and similar. |
| `social` | User-generated platforms: youtube.com, reddit.com, instagram.com, quora.com and similar. |
| `health-pharma` | Pharmacy and medical content: apollopharmacy.in, netmeds.com, pharmeasy.in, mrmed.in. |

A domain matches a class if it equals a listed hostname or is a subdomain of one. Anything unmatched falls to `other`, which is not a key in the file. Every domain with 10 or more citations in the corpus is classified explicitly; `other` is the long tail.

## `data/analysis/stability.json`

Output of `stability-check.mjs` over `data/raw-stability/`. `prompts` lists the two prompt ids rerun (`S01`, `F02`). `engines[name]` gives `freshWithinLang`, `freshCrossLang`, `directionHolds`, `freshVsPrimarySameLang`, `primaryWithinLang`, `driftRatio` and `nFresh`.

`driftRatio` is `freshVsPrimarySameLang` divided by `primaryWithinLang`, so values near 1 mean the engine had not drifted between the two windows. The shipped values are ChatGPT 0.91, Gemini 1.05, Perplexity 1.04.

**Both terms of that ratio are restricted to the two rerun prompts, S01 and F02.** The `primaryWithinLang` figures in this file are ChatGPT 49.5%, Gemini 50.3%, Perplexity 78.1%. They are **not** comparable to the corpus-wide within-language overlaps of 54.7%, 51.2% and 68.3% reported in `results.json` and in the report, which are computed over all ten prompts. Dividing the fresh overlaps by those corpus-wide numbers gives a different and wrong answer. If you recompute drift, restrict the primary side to S01 and F02.

## Recipes

Plain Node, no dependencies. Save each snippet as a `.mjs` file and run `node yourfile.mjs` from the repository root. Node 18 or newer. Saving them as `.js` will fail with `SyntaxError: Cannot use import statement outside a module`, because the repository's own scripts are `.mjs` and there is no `"type": "module"` to inherit. Every output block below is the real output of the snippet above it, run against the committed data.

### 1. How often does a brand appear, by engine and language

```js
import fs from 'node:fs';

const rows = JSON.parse(fs.readFileSync('data/analysis/responses.json', 'utf8'));
const BRAND = 'The Derma Co'; // must match a `canonical` in brand-lexicon.json

const table = {};
for (const r of rows) {
  const key = `${r.engine}/${r.lang}`;
  table[key] ??= { hits: 0, n: 0 };
  table[key].n += 1;
  if (r.brands.includes(BRAND)) table[key].hits += 1;
}

for (const [key, { hits, n }] of Object.entries(table).sort((a, b) => a[0].localeCompare(b[0])))
  console.log(`${key.padEnd(14)} ${String(hits).padStart(2)}/${n}  ${((100 * hits) / n).toFixed(1)}%`);
```

```
chatgpt/en     20/80  25.0%
chatgpt/hg     20/80  25.0%
gemini/en      30/80  37.5%
gemini/hg      23/80  28.8%
perplexity/en   2/80  2.5%
perplexity/hg  16/80  20.0%
```

That Perplexity row is one of the study's larger brand swings: The Derma Co goes from 2/80 (2.5%) on English prompts to 16/80 (20.0%) on Hinglish. Report brand shares with the count alongside them, because a bare rounded percentage hides how few responses are behind it.

Swap `r.brands.includes` for `r.top3Brands.includes` to reproduce `top3Visibility`, or `r.firstBrand === BRAND` for first-mention share.

### 2. Wilson interval for a brand in one cell

The same estimator `analyze.mjs` uses, so this reproduces `results.json` exactly.

```js
import fs from 'node:fs';

function wilson(k, n, z = 1.96) {
  if (n === 0) return { p: null, lo: null, hi: null };
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return { p, lo: Math.max(0, center - half), hi: Math.min(1, center + half) };
}

const rows = JSON.parse(fs.readFileSync('data/analysis/responses.json', 'utf8'));
const BRAND = 'Minimalist';
const ENGINE = 'perplexity';

for (const lang of ['en', 'hg']) {
  const cell = rows.filter((r) => r.engine === ENGINE && r.lang === lang);
  const k = cell.filter((r) => r.brands.includes(BRAND)).length;
  const { p, lo, hi } = wilson(k, cell.length);
  if (p === null) {
    console.log(`${ENGINE} ${lang}: no responses`);
    continue;
  }
  console.log(
    `${ENGINE} ${lang}: ${k}/${cell.length} = ${(100 * p).toFixed(1)}%  95% CI [${(100 * lo).toFixed(1)}, ${(100 * hi).toFixed(1)}]`,
  );
}
```

```
perplexity en: 18/80 = 22.5%  95% CI [14.7, 32.8]
perplexity hg: 27/80 = 33.8%  95% CI [24.3, 44.6]
```

Those match `results.json` at `rq1_brands.visibility.perplexity.en.Minimalist` and `.hg.Minimalist` to the digit. Overlapping intervals here do not settle the language question. The paired sign-flip test in `results.json` is the inferential answer; a per-brand interval is descriptive.

### 3. Read one prompt pair side by side

```js
import fs from 'node:fs';

const PROMPT = 'S02', ENGINE = 'gemini', REP = 1;
const read = (lang) =>
  JSON.parse(fs.readFileSync(`data/raw/${PROMPT}_${lang}_${ENGINE}_r${REP}.json`, 'utf8'));

const domainOf = (url) => {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; }
};

for (const lang of ['en', 'hg']) {
  const d = read(lang);
  const domains = [...new Set(d.response.citations.map((c) => domainOf(c.url)).filter(Boolean))];
  console.log(`\n===== ${d.meta.cellId} =====`);
  console.log(`prompt: ${d.meta.promptText}`);
  console.log(`answer (first 200 chars):\n${d.response.text.slice(0, 200)}`);
  console.log(`citations: ${d.response.citations.length} (${domains.length} distinct domains)`);
  console.log(`domains: ${domains.join(', ') || '(none)'}`);
}
```

```

===== S02_en_gemini_r1 =====
prompt: I want to buy a sunscreen that doesn't leave a white cast on Indian skin. Which one is best?
answer (first 200 chars):
Finding a sunscreen that doesn’t leave a white cast on Indian skin tones comes down to choosing **chemical or hybrid sunscreens** instead of heavy, 100% mineral formulas.[glowdekho.com](https://glowde
citations: 11 (3 distinct domains)
domains: glowdekho.com, apollopharmacy.in, mirhaandco.com

===== S02_hg_gemini_r1 =====
prompt: Mujhe aisa sunscreen kharidna hai jo Indian skin par white cast na chhode. Konsa best hai?
answer (first 200 chars):
Indian skin par white cast (safahag pan) ki problem se bachne ke liye **chemical sunscreens**, **hybrid sunscreens**, ya **tinted sunscreens** sabse best hote hain, kyunki ye skin mein bilkul transpar
citations: 0 (0 distinct domains)
domains: (none)
```

This cell is a clean instance of the Gemini pattern: the English answer carries 11 citations across 3 domains, the Hinglish answer carries none. Across the corpus Gemini attaches at least one citation to 72 of 80 English answers and 33 of 80 Hinglish answers.

### 4. Most-cited domains across the corpus

```js
import fs from 'node:fs';

const rows = JSON.parse(fs.readFileSync('data/analysis/responses.json', 'utf8'));
const tally = new Map(); // domain -> { en, hg }

for (const r of rows)
  for (const d of r.citationDomains) {
    const t = tally.get(d) ?? { en: 0, hg: 0 };
    t[r.lang] += 1;
    tally.set(d, t);
  }

const top = [...tally.entries()]
  .sort((a, b) => b[1].en + b[1].hg - (a[1].en + a[1].hg))
  .slice(0, 10);

console.log('domain'.padEnd(24), 'total', ' en', ' hg');
for (const [d, t] of top)
  console.log(d.padEnd(24), String(t.en + t.hg).padStart(5), String(t.en).padStart(3), String(t.hg).padStart(3));
```

```
domain                   total  en  hg
reddit.com                 106  56  50
youtube.com                100  58  42
nykaa.com                   93  50  43
flipkart.com                79  39  40
amazon.in                   79  42  37
instagram.com               67  40  27
smytten.com                 52  30  22
ndtvshopping.com            49  20  29
hindustantimes.com          48  26  22
myntra.com                  47  30  17
```

Counts are responses citing the domain, not citation events, because `citationDomains` is deduplicated per response. For citation events, read `response.citations` out of `data/raw/` instead. The mix is dominated by Perplexity, which averages 19.6 citations per English answer and 18.8 per Hinglish answer against ChatGPT's 2.5 and 2.6 (`rq2_citations.meanCitations`), so filter by engine before reading anything into it.

## Things to know before you draw conclusions

- Citations are the sources an engine **displayed**, not verified provenance for its claims.
- The ChatGPT brand-set gap is the study's most fragile result: exact one-sided p = .046, two-sided p = .092, and the gap is concentrated in the skincare half (skincare mean delta 4.45 points, p = .063; fashion 0.01 points, p = .469). Read ChatGPT as approximately language-invariant.
- Both answers being brand-silent or citation-silent counts as Jaccard 1.0 in the overlap statistics, a documented convention in `analyze.mjs`.
- 10 prompts in 2 categories, one 56-minute fieldwork window on 2026-08-14, one Hinglish register, logged-out default surfaces. The corpus supports claims about these prompt classes at this moment, not about Indian buying queries in general.
- The study measures what the engines returned. It does not separate retrieval from generation, so it cannot say whether a language effect comes from which documents were fetched or from how the answer was written.
- Brand matching is a regex instrument with known failure modes, which is why `risky_alias`, `context_regex` and `exclude_following` exist. If you add brands, add the flags too.
- The study was funded and run by Depra Research, which sells AI-visibility tracking. The full corpus and pipeline are published so you can check the work rather than take it on trust.

Questions or corrections: team@depra.ai.
