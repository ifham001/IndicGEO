# Same question, different brands: what happens when Indian shoppers ask AI in Hinglish instead of English

**Depra Research** (depra.ai) · Study ID `hinglish-geo-study` · Fieldwork 2026-08-14 · Report v1.0 (post-verification)

---

## Abstract

We ran the first controlled comparison of English versus Hinglish purchase-intent prompts against the three AI answer engines Indian consumers actually use: ChatGPT (chatgpt.com UI capture, Search mode), Gemini (gemini.google.com UI capture), and Perplexity (Sonar with live web search). Ten brand-unaided buying prompts (5 skincare, 5 fashion), each written as a verified semantically-equivalent English/Hinglish pair, were run 8 times per language per engine, India-geolocated, in a single 57-minute window: 480 responses in total.

Prompt language changes what AI recommends, and the size of the effect depends on the engine far more than on the category. Measured as the gap between rerun-to-rerun brand overlap and cross-language brand overlap (so that the engine's own randomness is the null baseline), the language effect is barely present on ChatGPT (Jaccard gap 2.2 points, exact one-sided p = .046), moderate on Gemini (7.8 points, p = .0098), and large on Perplexity (23.4 points, p = .0010). Citations diverge even harder: Gemini attaches sources to 90% of English answers but only 41% of Hinglish answers, and Perplexity's cited-domain overlap drops 32 points across languages. Engines almost always answer Hinglish prompts in Hinglish (ChatGPT and Perplexity 80/80; Gemini 71/80, with 8 answers switching to Devanagari script). Individual brands swing hard on the more language-sensitive engines: on Perplexity, The Derma Co appears in 2.5% of English answers but 20.0% of Hinglish ones, while Taneira (15.0% to 0.0%) and La Roche-Posay (13.8% to 1.3%) essentially disappear from Hinglish answers. Every number in this report was independently reproduced from raw data by adversarial verification agents before publication.

For the GEO/AEO field this establishes a basic fact: **AI visibility measured only in English does not describe what code-mixed users see.** All raw data, code, prompts, lexicon, and methodology are published for independent recomputation.

---

## 1. Why this study exists

India is ChatGPT's second-largest market, and the majority written register of urban Hindi-belt users online is romanized Hinglish, not English and not Devanagari Hindi (Nature HSSC 2024: ~60% of sampled tweets). Every commercial AI-visibility tracker, and nearly all published GEO research, measures English prompts only. Prior literature had established that query language moves LLM answers and citations for clean translations between major languages, but no study had ever tested code-mixed input, no study had geolocated GEO measurement to India, and none had done it on purchase-intent prompts (see `lit-review/LIT-REVIEW.md`, 70 sources). This study fills exactly that gap, deliberately small and deep: 10 prompts, 2 categories, 3 engines, 8 repetitions, every claim carried by intervals and exact tests.

## 2. Design in one table

| | |
|---|---|
| Prompts | 10 buying prompts, brand-unaided (5 skincare, 5 fashion), frozen in `prompts.json` v1.1 |
| Language pairs | English / romanized Hinglish, semantic equivalence independently reviewed (3 pairs failed review and were fixed before analysis; log in `lit-review/prompt-verification.md`) |
| Code-mix density | 43-69% Hindi-token share per Hinglish prompt (mean ≈ 59%) |
| Engines | ChatGPT (UI capture, Search mode), Gemini (UI capture), Perplexity (Sonar + web search) via DataForSEO, all India-geolocated |
| Repetitions | 8 per cell (raised from 5 after the literature review; deviation logged) |
| Total | 480 responses, zero permanent failures, $2.16 total API spend |
| Window | 2026-08-14 12:25-13:22 UTC, execution order randomized and interleaved (seed 20260814) |
| Stats | Wilson 95% intervals; exact prompt-level sign-flip permutation tests (2^10 enumerated); clustered bootstrap over prompts; engines never pooled |

The full pre-registered-style design, controls, and deviations log: `METHODOLOGY.md`.

## 3. Results

### 3.1 The core test: is the language effect bigger than the engine's own noise?

An AI engine does not give the same answer twice. Any honest language comparison must therefore beat the rerun baseline: we compare brand-set overlap between languages against brand-set overlap between identical reruns. If the two are equal, language does not matter.

**Brand sets (RQ1):**

| Engine | Rerun overlap (within-language Jaccard) | Cross-language Jaccard | Gap Δ | 95% CI | Exact sign-flip p (one-sided) |
|---|---|---|---|---|---|
| ChatGPT | 54.7% | 52.5% | **2.2 pts** | [0.3, 4.6] | .046 |
| Gemini | 51.2% | 43.3% | **7.8 pts** | [2.6, 13.9] | .0098 |
| Perplexity | 68.3% | 44.9% | **23.4 pts** | [12.9, 35.1] | .0010 |

**Cited domains (RQ2):**

| Engine | Rerun overlap | Cross-language | Gap Δ | Exact p (one-sided) |
|---|---|---|---|---|
| ChatGPT | 33.4% | 30.3% | 3.1 pts | .033 |
| Gemini | 33.1% | 10.8% | 22.3 pts | .0098 |
| Perplexity | 85.2% | 52.8% | 32.4 pts | .0010 |

All p-values are one-sided by design (H1: cross-language overlap below rerun overlap), fixed in the methodology before analysis. The ChatGPT brand effect is the study's most fragile finding and we bound it explicitly: the equivalent two-sided p is .092 (Gemini .020 and Perplexity .002 survive two-sided), the effect is carried entirely by the skincare prompts (skincare mean delta 4.45 points, p = .063; fashion mean delta 0.01 points, p = .469), 4 of 10 per-prompt deltas are negative, and we describe ChatGPT as approximately language-invariant rather than as showing a robustly demonstrated effect.

Three readings of these tables:

1. **The effect is real on all three engines** (all exact p < .05, primary confirmatory test), but the magnitude spans an order of magnitude. ChatGPT treats Hinglish almost as a surface change; Perplexity retrieves and recommends substantially differently.
2. **Perplexity is simultaneously the most self-consistent engine and the most language-sensitive.** Its rerun overlap (68% brands, 85% domains) is the highest of the three, so its cross-language drop is not noise, it is behavior.
3. The rerun baselines themselves (51-68% brand Jaccard) land inside the 0.5-0.6 band that prior work measured for identical-prompt reruns (Schulte et al. 2026; Unusual.ai 2026), an external anchor that our capture pipeline behaves like published ones.

Category splits: the effect concentrates in skincare on ChatGPT and Gemini (skincare p = .063/.031, fashion p = .469/.156, N=5 each, exact tests on 32 sign patterns), while Perplexity shows it in both categories (p = .031/.031). Small-N category splits are directional evidence only.

### 3.2 Which brands move

Share of the 80 responses per engine-language cell that mention the brand (top movers; full tables with Wilson CIs in `data/analysis/results.json`):

**Perplexity, the most language-sensitive engine:**

| Brand | English | Hinglish | Δ (pts) |
|---|---|---|---|
| The Derma Co | 2.5% (2/80) | 20.0% (16/80) | +17.5 |
| Deconstruct | 3.8% (3/80) | 16.3% (13/80) | +12.5 |
| Minimalist | 22.5% (18/80) | 33.8% (27/80) | +11.3 |
| Allen Solly | 1.3% (1/80) | 11.3% (9/80) | +10.0 |
| Aurelia | 0.0% (0/80) | 10.0% (8/80) | +10.0 |
| Plum | 28.7% (23/80) | 15.0% (12/80) | −13.7 |
| Taneira | 15.0% (12/80) | 0.0% (0/80) | −15.0 |
| La Roche-Posay | 13.8% (11/80) | 1.3% (1/80) | −12.5 |
| Vastranand | 10.0% (8/80) | 0.0% (0/80) | −10.0 |

**Gemini:**

| Brand | English | Hinglish | Δ (pts) |
|---|---|---|---|
| Dot & Key | 10.0% (8/80) | 21.3% (17/80) | +11.3 |
| Allen Solly | 5.0% (4/80) | 15.0% (12/80) | +10.0 |
| Plum | 18.8% (15/80) | 27.5% (22/80) | +8.7 |
| CeraVe | 10.0% (8/80) | 0.0% (0/80) | −10.0 |
| Pilgrim | 10.0% (8/80) | 1.3% (1/80) | −8.7 |
| Minimalist | 45.0% (36/80) | 36.3% (29/80) | −8.7 |
| The Derma Co | 37.5% (30/80) | 28.7% (23/80) | −8.8 |

**ChatGPT** movers stay within ±10 points (largest: Deconstruct 10.0% to 18.8%, Minimalist 36.3% to 42.5%, Chemist At Play 6.3% to 0.0%). These are consistent with each engine's aggregate effect size: the engine with the smallest overall language effect also has the smallest per-brand swings.

A pattern worth naming: on Perplexity, the brands that lose visibility in Hinglish skew international or premium (La Roche-Posay, CeraVe, Taneira as a premium Tata brand), while the gainers skew mass-market Indian D2C (The Derma Co, Deconstruct, Minimalist). The India-origin share of mentioned brands ticks up in Hinglish on Gemini (75.6% → 82.0%) and Perplexity (63.7% → 66.3%) but not ChatGPT (74.4% → 74.7%). We flag this as an observed tendency, not a tested hypothesis.

The brand named first agrees between languages far less than between reruns on Gemini (within 63.2% vs cross 42.2%) and Perplexity (69.5% vs 49.8%); ChatGPT again barely moves (60.0% vs 54.1%).

### 3.3 Citations: the Gemini collapse

The single starkest number in the study: **Gemini attached at least one citation to 90.0% of English answers [Wilson 95%: 81.5, 94.8] but only 41.3% of Hinglish answers [31.1, 52.3].** Mean citation counts drop from 9.4 to 5.2. Hinglish answers are also 33% shorter (4,609 → 3,099 characters on average). Gemini serves code-mixed users a thinner, less-sourced product.

ChatGPT and Perplexity cite at equal rates in both languages (100% each; ChatGPT means 2.5 vs 2.6, Perplexity 19.6 vs 18.8), but *which* domains they cite shifts, most strongly on Perplexity (domain-overlap gap 32.4 points). The citation economy behind AI answers in India is not what classic SEO metrics would predict in either language. Counting every appearance across the 4,640 citations in the corpus, youtube.com is the most-cited domain (534) and reddit.com is second (191), ahead of nykaa.com (176) and magicpin.in (133); a long tail of small Indian review blogs (indisangam.com 113, glowdekho.com, reviehub.in) out-cites most mainstream media. Counted instead by how many answers cite a domain at all, reddit.com leads (106 of 480 answers) with youtube.com second (100), so the two bases rank differently and the basis has to be stated. Both tables are emitted by `analyze.mjs` into `results.json` under `citedDomains`.

The .in TLD share of cited domains is steady on ChatGPT (28.9% to 28.8%) and Perplexity (27.3% to 27.9%) but falls on Gemini, 31.3% to 25.2%, where the Hinglish figure is computed over only the 33 answers that carried any citation.

### 3.4 Answer language: engines meet users where they are

| Engine | English prompt → | Hinglish prompt → |
|---|---|---|
| ChatGPT | 80/80 English | 80/80 Hinglish |
| Gemini | 80/80 English | 71 Hinglish, **8 Devanagari Hindi**, 1 English |
| Perplexity | 80/80 English | 80/80 Hinglish |

Language mirroring is near-perfect (classifier audited at 30/30 agreement against human judgment on a stratified sample, and the Devanagari count verified one-for-one by an independent script-level scan). The notable deviation: Gemini answered 10% of romanized-Hinglish prompts in Devanagari script, a register its users did not type, on top of citing less and writing less in that arm.

### 3.5 The Nykaa integration flag

Because the Nykaa-OpenAI Agentic Commerce Protocol integration (June 2026) could structurally favor Nykaa in ChatGPT's shopping answers, Nykaa presence was flagged separately. "Cited" means the cited host is a Nykaa property (nykaa.com and subsidiaries); URL-fragment text mentioning Nykaa inside other sites' links does not count, and this convention changes the Gemini numbers by a few points if reversed. ChatGPT mentioned Nykaa in 10.0% of English and 7.5% of Hinglish answers and cited Nykaa hosts in 11.3% / 7.5%: no evidence of an integration-driven skew in this corpus. Incidentally, Gemini is the heaviest Nykaa citer (18.8% EN / 7.5% HG) and mentioner (32.5% EN / 20.0% HG), and Perplexity cites Nykaa MORE in Hinglish (36.3% EN / 47.5% HG). The flag is published so future waves can track the ACP effect longitudinally.

## 4. Verification

Four independent checks were built into the study:

1. **Prompt-pair review (pre-analysis).** An independent reviewer audited all 10 pairs for Hinglish naturalness, semantic equivalence, and purchase intent. Three fashion pairs failed (one missing India anchor that would have confounded language with market; one missing buy-intent verb; one double-barreled) and were rewritten before analysis; 5 affected cells were discarded and recollected. Full log: `lit-review/prompt-verification.md`.
2. **Adversarial recomputation.** Six independent verification agents recomputed headline numbers directly from raw data with their own code, without access to the analysis pipeline. All six checks reproduced, zero refuted. The Gemini citation gap (72/80 vs 33/80), the Perplexity overlap delta (23.75 points over 560 within-pairs and 640 cross-pairs), the ChatGPT exact permutation count (47/1024 after corrections), all India-origin shares (matched to 6 decimals), and all Nykaa rates including Wilson intervals were reproduced exactly.
3. **Risky-alias audit.** 26 brand names that collide with common English/Hindi words ("Bata" vs the Hinglish verb "bata", "Libas" as the Hindi noun) were matched case-sensitively and audited: 23 of 26 were fully clean; overall contamination before correction was 0.9% of all brand-response pairs. The audit found three instrument defects, all fixed and the pipeline re-run before this report's numbers were finalized: "Simple" had a 35% false-positive rate as a generic adjective (now requires a skincare context word within 80 characters), "Lee" was double-tagged when only "Lee Cooper" appeared (now excluded by lookahead), and one phantom "Asian" came from citation anchor text (now requires footwear context). The audit also confirmed the case-sensitivity rule is load-bearing in the conservative direction: recomputed against the shipped v1.1 lexicon, matching risky aliases case-insensitively inflates the ChatGPT gap from 2.2 to 13.7 points (p = .0010) through Hinglish false positives. Our instrument understates rather than manufactures the effect.
   The verification pass also caught two answer-language label errors (an English answer counted as Hinglish through marker-word collisions; a mixed-script answer over-counted as Devanagari), both fixed by classifier corrections logged in the deviations log.
4. **Temporal stability rerun.** Two prompts (S01, F02) were re-collected in both languages on all engines 30-60 minutes after their primary cells (reps 9-10, kept out of the primary analysis in `data/raw-stability/`). Direction holds on all three engines (fresh within-language overlap exceeds fresh cross-language overlap: ChatGPT 48.0% vs 43.8%, Gemini 65.1% vs 61.1%, Perplexity 83.3% vs 66.8%), and fresh-vs-primary same-language similarity matches the primary window's own rerun similarity for the same two prompts (drift ratios 0.91, 1.05, 1.04), so no material drift occurred inside the fieldwork window. Those baselines are computed over S01 and F02 only and are deliberately not comparable to the corpus-wide rerun figures in §3.1.

## 5. Limitations

Stated fully in `METHODOLOGY.md` §8; the ones that most bound interpretation:

1. **10 prompts in 2 categories.** Claims generalize to these prompt classes (brand-unaided, purchase-intent, skincare/fashion, India), not to "Indian buying queries" at large. Prompt identity is a variance source on the order of model identity (Mizrahi et al. 2024).
2. **One fieldwork window.** Engines drift week to week; these numbers are a snapshot. The stability rerun covers minutes-scale drift only.
3. **One Hinglish register.** Urban, romanized, English-noun-heavy code-mix at 43-69% density. Devanagari Hindi and other Indian languages are future waves.
4. **Logged-out default surfaces.** Personalized results for signed-in users may differ.
5. **Displayed sources, not provenance.** Citations are what engines show, not verified evidence for why a brand was named (~25% of generative citations do not support their sentence, per prior work).
6. **Funding interest disclosed.** The study was run by Depra, a commercial AI-visibility tracker. The mitigation is total transparency: every raw response, both analysis scripts, the lexicon, the domain table, seeds, and the frozen methodology are in this repository; every headline number is recomputable from `data/raw/`.

## 6. What this means

**For brands selling in India:** if your AI-visibility tracking runs English prompts only, you are measuring the smaller half of the market's actual query stream, and on Gemini and Perplexity you are measuring a different brand slate than Hinglish users see. Visibility work needs both arms.

**For the GEO/AEO field:** language is not a display variable, it is a retrieval variable. The effect size hierarchy (ChatGPT ≈ invariant, Gemini moderate + citation collapse, Perplexity large) suggests the mechanism is the engine's retrieval and search-language policy rather than the model's comprehension, consistent with prior findings that engines fan out searches in English for non-English prompts at very different rates.

**For engine builders:** Gemini's Hinglish arm (fewer citations, shorter answers, occasional script switching) is a measurably thinner product for code-mixed users, the majority register of one of its largest markets.

## 7. Reproducibility

```
research/hinglish-geo-study/
  METHODOLOGY.md            frozen design + deviations log
  prompts.json              v1.1 frozen prompt pairs
  run-experiment.mjs        collection (DataForSEO; seed 20260814)
  build-lexicon.mjs         lexicon candidate extraction
  analyze.mjs               full analysis (Wilson, sign-flip exact, bootstrap)
  stability-check.mjs       temporal stability spot-check
  data/raw/                 480 primary responses, reps 1-8 (full API payloads)
  data/raw-stability/       24 stability-rerun responses (reps 9-10, S01+F02 only;
                            excluded from every primary number by directory separation)
  data/analysis/            lexicon, domain classes, tidy responses, results
  lit-review/               70-source literature review + prompt verification
```

Rerun: `node analyze.mjs` recomputes every number in this report from raw data deterministically (all bootstrap/permutation seeds fixed, no wall-clock values written). The output is byte-reproducible, so a third party can verify a clean recomputation with one command:

```
shasum -a 256 data/analysis/results.json
# 6f9a67de4c11f11b3e157b1f21799fce66161393d24b5a043eb4a1c395de1776
```

The expected digest is also committed as `data/analysis/results.sha256`. Total collection cost: $2.16 via DataForSEO (ChatGPT/Gemini LLM Scraper, Perplexity LLM Responses).

## 8. Key references

The working bibliography is `lit-review/LIT-REVIEW.md` (70 sources). Load-bearing citations for the design:

- Aggarwal, Murahari et al., *GEO: Generative Engine Optimization*, KDD 2024. arXiv:2311.09735
- Schulte, Bleeker, Kaufmann, *Don't Measure Once: Measuring Visibility in AI Search*, 2026. arXiv:2604.07585
- Chen et al., cross-language GEO citation study, 2025. arXiv:2509.08919
- Sharma et al., *Faux Polyglot: language preference in RAG*, NAACL 2025
- Park & Lee, Latin-script evidence preference, Findings of ACL 2025
- Qi et al., cross-lingual factual consistency, EMNLP 2023
- Wendler et al., *Do Llamas Work in English?*, ACL 2024
- Miller, *Adding Error Bars to Evals*, 2024. arXiv:2411.00640
- Bowyer et al., small-N eval intervals, ICML 2025
- Ernst, permutation methods, *Statistical Science* 2004
- Brown, Cai, DasGupta, interval estimation for a binomial proportion, *Statistical Science* 2001
- GLUECoS (ACL 2020), LinCE (LREC 2020), HinglishEval, CodeMixBench (EMNLP 2025) for the code-mixed NLP baseline

## Appendix A: the ten prompt pairs (v1.1)

| ID | English | Hinglish |
|---|---|---|
| S01 | Which face wash should I buy for oily skin in India under ₹500? | India mein oily skin ke liye 500 rupees ke andar konsa face wash kharidna chahiye? |
| S02 | I want to buy a sunscreen that doesn't leave a white cast on Indian skin. Which one is best? | Mujhe aisa sunscreen kharidna hai jo Indian skin par white cast na chhode. Konsa best hai? |
| S03 | Which vitamin C serum should I buy for dark spots and dull skin in India? | Dark spots aur dull skin ke liye India mein konsa vitamin C serum kharidun? |
| S04 | Which moisturizer should I buy for dry skin in Indian winters? | Indian winters mein dry skin ke liye konsa moisturizer kharidna chahiye? |
| S05 | Which serum should I buy for acne-prone skin in India under ₹700? | India mein acne wali skin ke liye 700 rupees ke andar konsa serum kharidun? |
| F01 | Which brand's jeans should I buy for men in India under ₹2000? | India mein 2000 rupees ke andar men ke liye konse brand ki jeans kharidni chahiye? |
| F02 | I want to buy running shoes under ₹3000 in India. Which ones should I get? | Mujhe India mein 3000 rupees ke andar running shoes kharidne hain. Konse lene chahiye? |
| F03 | Which brand's kurta sets should I buy for women online in India? | India mein women ke liye online konse brand ke kurta sets kharidun? |
| F04 | Which brand's formal shirts should I buy for men in India? | India mein men ke liye konse brand ki formal shirts kharidni chahiye? |
| F05 | Which sarees should I buy online in India for a wedding on a budget? | India mein shaadi ke liye budget mein online konsi sarees kharidun? |
