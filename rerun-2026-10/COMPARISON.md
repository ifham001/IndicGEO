# August 2026 vs October 2026: is the Hinglish gap still there?

August: 480 answers, $2.158731000000001. October: 479 answers, $2.141772000000001. Same 10 prompts, engines, India geolocation, 8 reps, lexicon and analysis code.

## Headline numbers

| Engine | Wave | Rerun brand overlap | Cross-language | Gap (pts) | 95% CI | exact p | Domain gap (pts) | p | Cites EN | Cites HG | Mean cites EN/HG | Chars EN/HG |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| chatgpt | Aug | 54.7% | 52.5% | **2.2** | [0.3, 4.6] | 0.0458984375 | 3.1 | 0.033203125 | 100% (80/80) | 100% (80/80) | 2.5 / 2.6 | 2222 / 1961 |
| chatgpt | Oct | 49.6% | 48.8% | **0.8** | [-0.8, 2.7] | 0.2421875 | 0.7 | 0.2685546875 | 100% (80/80) | 100% (80/80) | 6.6 / 5.9 | 4745 / 4252 |
| gemini | Aug | 51.2% | 43.3% | **7.8** | [2.6, 13.9] | 0.009765625 | 22.3 | 0.009765625 | 90% (72/80) | 41.3% (33/80) | 9.4 / 5.2 | 4609 / 3099 |
| gemini | Oct | 41.5% | 39.5% | **2** | [0, 4.4] | 0.0625 | 3 | 0.1201171875 | 73.4% (58/79) | 56.3% (45/79) | 5.8 / 5.1 | 4094 / 3175 |
| perplexity | Aug | 68.3% | 44.9% | **23.4** | [12.9, 35.1] | 0.0009765625 | 32.4 | 0.0009765625 | 100% (80/80) | 100% (80/80) | 19.6 / 18.8 | 1485 / 1627 |
| perplexity | Oct | 76.1% | 47.9% | **28.2** | [16.7, 41.9] | 0.0009765625 | 52.6 | 0.0009765625 | 100% (80/80) | 100% (80/80) | 10 / 10 | 1323 / 1322 |

## Do the August claims hold?

| Claim | August | October | Holds |
|---|---|---|---|
| chatgpt: brand lists differ more across languages than across reruns (gap > 0, exact p < .05) | 2.2 pts, p=0.0458984375 | 0.8 pts, p=0.2421875 | NO |
| chatgpt: cited domains differ more across languages than across reruns (gap > 0, exact p < .05) | 3.1 pts, p=0.033203125 | 0.7 pts, p=0.2685546875 | NO |
| gemini: brand lists differ more across languages than across reruns (gap > 0, exact p < .05) | 7.8 pts, p=0.009765625 | 2 pts, p=0.0625 | NO |
| gemini: cited domains differ more across languages than across reruns (gap > 0, exact p < .05) | 22.3 pts, p=0.009765625 | 3 pts, p=0.1201171875 | NO |
| perplexity: brand lists differ more across languages than across reruns (gap > 0, exact p < .05) | 23.4 pts, p=0.0009765625 | 28.2 pts, p=0.0009765625 | yes |
| perplexity: cited domains differ more across languages than across reruns (gap > 0, exact p < .05) | 32.4 pts, p=0.0009765625 | 52.6 pts, p=0.0009765625 | yes |
| Engine order by brand gap (most to least language-sensitive) | perplexity > gemini > chatgpt | perplexity > gemini > chatgpt | yes |
| Gemini cites far less often in Hinglish than in English | 90% vs 41.3% (gap 48.7 pts) | 73.4% vs 56.3% (gap 17.1 pts) | NO |
| ChatGPT and Perplexity cite in every answer in both languages | 100/100 and 100/100 | 100/100 and 100/100 | yes |

## Drift over two months (same language, same prompt): Aug reps vs Oct reps

| Engine.lang | Aug-vs-Oct Jaccard | Rerun Jaccard Aug | Rerun Jaccard Oct | Drift ratio (1.0 = no more change than a rerun) |
|---|---|---|---|---|
| chatgpt.en | 45.6% | 54.4% | 48.3% | 0.89 |
| chatgpt.hg | 44.1% | 55% | 50.9% | 0.83 |
| gemini.en | 39.6% | 50.1% | 41.7% | 0.86 |
| gemini.hg | 41.5% | 52.2% | 41.2% | 0.89 |
| perplexity.en | 28.4% | 69.2% | 72.5% | 0.4 |
| perplexity.hg | 42.1% | 67.4% | 79.7% | 0.57 |

## Brands that moved most between August and October (share of 80 answers)

**chatgpt.en** top 5 Aug: Minimalist 29, The Derma Co 20, Re'equil 15, Dot & Key 11, Plum 9 | top 5 Oct: Minimalist 29, The Derma Co 25, Cetaphil 16, Re'equil 11, Libas 10

| Brand | Aug | Oct | Δ |
|---|---|---|---|
| Cetaphil | 10% (8) | 20% (16) | +10 |
| Dot & Key | 13.8% (11) | 3.8% (3) | -10 |
| Pepe Jeans | 10% (8) | 1.3% (1) | -8.7 |
| H&M | 7.5% (6) | 0% (0) | -7.5 |
| The Derma Co | 25% (20) | 31.3% (25) | +6.3 |
| Blackberrys | 6.3% (5) | 0% (0) | -6.2 |
| Park Avenue | 8.8% (7) | 2.5% (2) | -6.2 |
| Campus | 7.5% (6) | 2.5% (2) | -5 |

**chatgpt.hg** top 5 Aug: Minimalist 34, The Derma Co 20, Deconstruct 15, Dot & Key 14, Re'equil 13 | top 5 Oct: Minimalist 26, The Derma Co 23, Cetaphil 12, Libas 12, Deconstruct 11

| Brand | Aug | Oct | Δ |
|---|---|---|---|
| Dot & Key | 17.5% (14) | 6.3% (5) | -11.2 |
| Minimalist | 42.5% (34) | 32.5% (26) | -10 |
| Re'equil | 16.3% (13) | 6.3% (5) | -10 |
| CeraVe | 10% (8) | 2.5% (2) | -7.5 |
| Pepe Jeans | 10% (8) | 3.8% (3) | -6.2 |
| Simple | 11.3% (9) | 5% (4) | -6.2 |
| Allen Solly | 7.5% (6) | 2.5% (2) | -5 |
| Bioderma | 3.8% (3) | 8.8% (7) | +5 |

**gemini.en** top 5 Aug: Minimalist 36, The Derma Co 30, Deconstruct 20, Plum 15, Cetaphil 9 | top 5 Oct: Minimalist 27, The Derma Co 23, Plum 17, Dot & Key 16, Foxtale 14

| Brand | Aug | Oct | Δ |
|---|---|---|---|
| Deconstruct | 25% (20) | 6.3% (5) | -18.7 |
| Foxtale | 3.8% (3) | 17.5% (14) | +13.8 |
| Minimalist | 45% (36) | 33.8% (27) | -11.2 |
| Dot & Key | 10% (8) | 20% (16) | +10 |
| The Derma Co | 37.5% (30) | 28.7% (23) | -8.7 |
| Zodiac | 8.8% (7) | 0% (0) | -8.7 |
| Bioderma | 8.8% (7) | 1.3% (1) | -7.5 |
| Blackberrys | 10% (8) | 3.8% (3) | -6.2 |

**gemini.hg** top 5 Aug: Minimalist 29, The Derma Co 23, Plum 22, Dot & Key 17, Deconstruct 13 | top 5 Oct: Plum 23, Minimalist 22, The Derma Co 20, Dot & Key 17, Cetaphil 9

| Brand | Aug | Oct | Δ |
|---|---|---|---|
| Allen Solly | 15% (12) | 5% (4) | -10 |
| CeraVe | 0% (0) | 8.8% (7) | +8.8 |
| Chemist At Play | 0% (0) | 8.8% (7) | +8.8 |
| Minimalist | 36.3% (29) | 27.5% (22) | -8.7 |
| Deconstruct | 16.3% (13) | 8.8% (7) | -7.5 |
| ASICS | 0% (0) | 6.3% (5) | +6.3 |
| Anouk | 6.3% (5) | 0% (0) | -6.2 |
| Aqualogica | 11.3% (9) | 5% (4) | -6.2 |

**perplexity.en** top 5 Aug: Plum 23, Minimalist 18, Taneira 12, CeraVe 11, La Roche-Posay 11 | top 5 Oct: Minimalist 21, The Derma Co 18, Cetaphil 16, Dot & Key 11, Foxtale 10

| Brand | Aug | Oct | Δ |
|---|---|---|---|
| The Derma Co | 2.5% (2) | 22.5% (18) | +20 |
| Plum | 28.7% (23) | 10% (8) | -18.7 |
| Taneira | 15% (12) | 0% (0) | -15 |
| Cetaphil | 6.3% (5) | 20% (16) | +13.8 |
| La Roche-Posay | 13.8% (11) | 0% (0) | -13.8 |
| Aurelia | 0% (0) | 10% (8) | +10 |
| Jaipur Kurti | 10% (8) | 0% (0) | -10 |
| Killer | 0% (0) | 10% (8) | +10 |

New in October (0 in Aug, ≥8/80 in Oct): Aurelia (8/80); Killer (8/80)
Gone in October (≥8/80 in Aug, 0 in Oct): Taneira (12/80); La Roche-Posay (11/80); Jaipur Kurti (8/80); Spykar (8/80); Supergoop (8/80); The Ordinary (8/80); Vastranand (8/80)

**perplexity.hg** top 5 Aug: Minimalist 27, The Derma Co 16, Pilgrim 14, Garnier 14, Libas 14 | top 5 Oct: Minimalist 33, The Derma Co 24, Plum 22, Libas 16, Peter England 10

| Brand | Aug | Oct | Δ |
|---|---|---|---|
| Pilgrim | 17.5% (14) | 1.3% (1) | -16.2 |
| Deconstruct | 16.3% (13) | 1.3% (1) | -15 |
| Garnier | 17.5% (14) | 2.5% (2) | -15 |
| Plum | 15% (12) | 27.5% (22) | +12.5 |
| Aachho | 10% (8) | 0% (0) | -10 |
| Bioderma | 0% (0) | 10% (8) | +10 |
| Indya | 10% (8) | 0% (0) | -10 |
| Jaipur Kurti | 10% (8) | 0% (0) | -10 |

New in October (0 in Aug, ≥8/80 in Oct): Bioderma (8/80)
Gone in October (≥8/80 in Aug, 0 in Oct): Aachho (8/80); Indya (8/80); Jaipur Kurti (8/80); Mohey (8/80)

## Did August's Hinglish movers move the same way in October? (HG minus EN answers out of 80)

**chatgpt**

| Brand | Aug HG−EN | Oct HG−EN | Same direction |
|---|---|---|---|
| Deconstruct | +7 | +4 | yes |
| Minimalist | +5 | -3 | NO |
| Chemist At Play | -5 | -2 | yes |

**gemini**

| Brand | Aug HG−EN | Oct HG−EN | Same direction |
|---|---|---|---|
| Dot & Key | +9 | +1 | yes |
| CeraVe | -8 | +1 | NO |
| Allen Solly | +8 | +2 | yes |
| Minimalist | -7 | -5 | yes |
| The Derma Co | -7 | -3 | yes |
| Deconstruct | -7 | +2 | NO |
| Plum | +7 | +6 | yes |
| Pilgrim | -7 | -6 | yes |
| Zodiac | -7 | 0 | flat |
| Sparx | +7 | +2 | yes |

**perplexity**

| Brand | Aug HG−EN | Oct HG−EN | Same direction |
|---|---|---|---|
| The Derma Co | +14 | +6 | yes |
| Taneira | -12 | 0 | flat |
| Plum | -11 | +14 | NO |
| La Roche-Posay | -10 | 0 | flat |
| Deconstruct | +10 | -6 | NO |
| Minimalist | +9 | +12 | yes |
| Vastranand | -8 | 0 | flat |
| Garnier | +8 | 0 | flat |
| Allen Solly | +8 | 0 | flat |
| Aurelia | +8 | 0 | flat |

## Most-cited domains (answers citing the domain at least once, all 480 per wave)

| # | August | October |
|---|---|---|
| 1 | reddit.com 106 | amazon.in 132 |
| 2 | youtube.com 100 | flipkart.com 82 |
| 3 | nykaa.com 93 | hindustantimes.com 76 |
| 4 | amazon.in 79 | nykaa.com 65 |
| 5 | flipkart.com 79 | thedermaco.com 64 |
| 6 | instagram.com 67 | google.com 55 |
| 7 | smytten.com 52 | vogue.in 47 |
| 8 | ndtvshopping.com 49 | grabon.in 46 |
| 9 | hindustantimes.com 48 | ndtvshopping.com 46 |
| 10 | myntra.com 47 | myntra.com 44 |
| 11 | blog.flash.co 43 | libas.in 42 |
| 12 | dotandkey.com 40 | 1.www.flipkart.com 40 |

Citation occurrences in all: August 4640, October 3471.
