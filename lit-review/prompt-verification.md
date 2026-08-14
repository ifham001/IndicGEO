# Prompt-pair verification log

Independent review of `prompts.json` v1.0 for (1) Hinglish naturalness, (2) semantic equivalence within each pair, (3) unambiguous purchase intent. Conducted 2026-08-14, before analysis and during the first minutes of fieldwork. Result: 7/10 PASS, 3/10 FAIL, all failures fixed in v1.1.

## Verdicts (v1.0)

| Pair | Naturalness | Equivalence | Purchase intent | Verdict |
|---|---|---|---|---|
| S01 face wash | pass | pass | pass | PASS |
| S02 sunscreen | pass | pass | pass | PASS |
| S03 vitamin C serum | pass | pass | pass | PASS |
| S04 moisturizer | pass | pass | pass | PASS |
| S05 acne serum | pass | pass (idiomatic "acne wali" = "acne-prone", documented) | pass | PASS |
| F01 jeans men | pass | pass | pass | PASS |
| F02 running shoes | pass | pass | pass | PASS |
| F03 kurta sets | pass | pass | pass | **FAIL** (design): double-barreled "where + which brands" solicits retailer recall (Myntra, Amazon, Nykaa Fashion) alongside product brands, contaminating the unaided brand-recall metric and breaking comparability with the other 9 prompts |
| F04 formal shirts | pass | pass | **FAIL**: neither version contained a buy verb; it was a brand-opinion query, violating design rule 1 | **FAIL** |
| F05 sarees | pass | **FAIL**: no India anchor in either version, and the asymmetry is real — Hinglish "shaadi" implicitly signals the Indian market while English "wedding" carries no market signal, confounding language with market; plus plural/singular drift ("sarees" vs "saree") | pass | **FAIL** |

## Fixes applied in v1.1 (reviewer's exact text)

- **F03** en: "Which brand's kurta sets should I buy for women online in India?" / hg: "India mein women ke liye online konse brand ke kurta sets kharidun?"
- **F04** en: "Which brand's formal shirts should I buy for men in India?" / hg: "India mein men ke liye konse brand ki formal shirts kharidni chahiye?"
- **F05** en: "Which sarees should I buy online in India for a wedding on a budget?" / hg: "India mein shaadi ke liye budget mein online konsi sarees kharidun?"

## Cross-cutting reviewer observations

1. Hinglish register genuinely strong: gender agreement correct throughout (jeans ki/kharidni, shoes kharidne hain, saree konsi); spellings (konsa, kharidun, chhode, wali) consistent with real typed usage. Nothing reads as machine translation.
2. All failures were in the fashion block; skincare block freeze-ready as reviewed.
3. F05 was the most serious for a publicly citable study: an asymmetric market signal is exactly the confound a critical reader would find.

## Data hygiene

The 5 cells collected under v1.0 for F03/F05 (F03_en_gemini_r5, F03_en_perplexity_r2, F03_hg_perplexity_r4, F05_hg_chatgpt_r5, F05_hg_perplexity_r1) were deleted before analysis. F04's v1.0 text had produced no cells at deletion time. Recorded in METHODOLOGY.md §10 Deviations log.
