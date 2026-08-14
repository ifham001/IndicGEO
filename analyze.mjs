#!/usr/bin/env node
// Hinglish vs English GEO study — analysis pipeline.
// Inputs:  data/raw/*.json  (collected responses)
//          data/analysis/brand-lexicon.json   (curated; published with study)
//          data/analysis/domain-classes.json  (curated; published with study)
// Outputs: data/analysis/responses.json  (tidy per-response records)
//          data/analysis/results.json    (aggregates, CIs, tests)
// All randomness (bootstrap/permutation) is seeded → identical reruns.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(HERE, 'data', 'raw');
const ANA_DIR = path.join(HERE, 'data', 'analysis');
const SEED = 20260814;
const N_BOOT = 10_000;
const N_PERM = 10_000;

// ---------- seeded PRNG ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- stats ----------
function wilson(k, n, z = 1.96) {
  if (n === 0) return { p: null, lo: null, hi: null };
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return { p, lo: Math.max(0, center - half), hi: Math.min(1, center + half) };
}
function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1; // both silent → identical (documented convention)
  const inter = [...a].filter((x) => b.has(x)).length;
  return inter / (a.size + b.size - inter);
}
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

// ---------- load curated inputs ----------
const lexicon = JSON.parse(fs.readFileSync(path.join(ANA_DIR, 'brand-lexicon.json'), 'utf8'));
const domainClasses = JSON.parse(fs.readFileSync(path.join(ANA_DIR, 'domain-classes.json'), 'utf8'));

// Risky aliases (brand names colliding with common English/Hindi words, e.g.
// "Bata" vs Hinglish "bata do", "Libas" as the Hindi noun) are matched
// CASE-SENSITIVELY in their listed capitalization; everything else is
// case-insensitive. Without this, collisions would inflate those brands only
// in the Hinglish arm — a language-correlated measurement bias.
// v1.1 lexicon extensions (verification-driven): context_regex requires a
// context pattern within +-80 chars of the brand match (Simple, Asian);
// exclude_following is a negative lookahead after the name (Lee vs Lee Cooper).
const brandMatchers = lexicon.brands.map((b) => ({
  canonical: b.canonical,
  indiaOrigin: !!b.india_origin,
  risky: !!b.risky_alias,
  context: b.context_regex ? new RegExp(b.context_regex, 'i') : null,
  res: [b.canonical, ...(b.aliases ?? [])].map(
    (a) =>
      new RegExp(
        `(?<![A-Za-z0-9])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9])${b.exclude_following ? `(?!${b.exclude_following})` : ''}`,
        b.risky_alias ? 'g' : 'gi',
      ),
  ),
}));

// ---------- language classifier ----------
// v1.1 (verification-driven): tokens that collide with common English words
// (me, to, hi, na, par, lo, ya, mil) removed from the marker list after an
// audit found an English answer crossing the threshold through them; the
// Devanagari cutoff raised 5% → 30% of characters so mixed-script but
// romanized-dominant answers classify as hinglish.
const HINGLISH_WORDS = new Set(
  'hai hain ke ki ka ko se mein liye aur wala wale wali nahi nahin aap tum kar karna karein karo lena lene accha acchi acche achha sabse andar chahiye konsa konsi kaunsa kaunsi agar bhi yeh woh jo magar lekin kuch mujhe mera meri apna apni apne raha rahi rahe rahega milega jata jati jaate hota hoti hote batao bataye dekhe dekhein chunte waqt kyun kya kahan kab kaise'.split(' '),
);
function classifyLanguage(raw) {
  // Strip URLs before classifying: citation links inside markdown inflate the
  // Latin letter count and can mask a Devanagari answer (found in verification).
  const text = raw.replace(/\(https?:\/\/[^)]+\)/g, '').replace(/https?:\/\/\S+/g, '');
  const dev = (text.match(/[ऀ-ॿ]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  if (dev + latin > 0 && dev / (dev + latin) > 0.3) return 'hindi-devanagari';
  const tokens = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (!tokens.length) return 'unknown';
  const hits = tokens.filter((t) => HINGLISH_WORDS.has(t));
  const distinct = new Set(hits);
  return hits.length / tokens.length >= 0.02 && distinct.size >= 3 ? 'hinglish' : 'english';
}

// ---------- domain helpers ----------
function domainOf(url) {
  try {
    let h = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return h;
  } catch {
    return null;
  }
}
function classOf(domain) {
  if (!domain) return 'other';
  for (const [cls, list] of Object.entries(domainClasses.classes))
    if (list.some((d) => domain === d || domain.endsWith('.' + d))) return cls;
  return 'other';
}

// ---------- tidy per-response records ----------
const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.json') && !f.includes('.failed.'));
const responses = files.map((f) => {
  const d = JSON.parse(fs.readFileSync(path.join(RAW_DIR, f), 'utf8'));
  const text = d.response.text;
  const found = [];
  for (const bm of brandMatchers) {
    let firstIdx = Infinity;
    for (const re of bm.res) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const ok = !bm.context || bm.context.test(text.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80));
        if (ok) {
          if (m.index < firstIdx) firstIdx = m.index;
          break;
        }
      }
    }
    if (firstIdx < Infinity) found.push({ brand: bm.canonical, firstIdx, indiaOrigin: bm.indiaOrigin });
  }
  found.sort((a, b) => a.firstIdx - b.firstIdx);
  const domains = [...new Set(d.response.citations.map((c) => domainOf(c.url)).filter(Boolean))];
  return {
    cellId: d.meta.cellId, promptId: d.meta.promptId, category: d.meta.category,
    lang: d.meta.lang, engine: d.meta.engine, rep: d.meta.rep,
    startedAt: d.meta.startedAt, durationMs: d.meta.durationMs, attempt: d.meta.attempt,
    textLength: text.length,
    answerLanguage: classifyLanguage(text),
    brands: found.map((x) => x.brand),
    firstBrand: found[0]?.brand ?? null,
    top3Brands: found.slice(0, 3).map((x) => x.brand),
    nykaaInText: /(?<![A-Za-z0-9])nykaa(?![A-Za-z0-9])/i.test(text),
    nykaaCited: d.response.citations.some((c) => (domainOf(c.url) ?? '').includes('nykaa')),
    indiaOriginShare: found.length ? found.filter((x) => x.indiaOrigin).length / found.length : null,
    nCitations: d.response.citations.length,
    citationDomains: domains,
    domainClassCounts: domains.reduce((acc, dm) => ((acc[classOf(dm)] = (acc[classOf(dm)] ?? 0) + 1), acc), {}),
    inTldShare: domains.length ? domains.filter((dm) => dm.endsWith('.in')).length / domains.length : null,
    costUsd: d.response.costUsd,
  };
});
fs.writeFileSync(path.join(ANA_DIR, 'responses.json'), JSON.stringify(responses, null, 1));

const ENGINES = [...new Set(responses.map((r) => r.engine))].sort();
const PROMPTS = [...new Set(responses.map((r) => r.promptId))].sort();
const byCell = (engine, promptId, lang) =>
  responses.filter((r) => r.engine === engine && r.promptId === promptId && r.lang === lang);

// ---------- primary inference: exact paired sign-flip permutation ----------
// Per-prompt statistic d_p = mean(within-language Jaccard) - mean(cross-language
// Jaccard). Enumerates all 2^N sign assignments (N = #prompts) for an exact
// one-sided p-value (H1: within > cross, i.e. language changes results).
function signFlipExact(setOf, promptFilter, engine) {
  const ds = [];
  for (const p of promptFilter) {
    const en = byCell(engine, p, 'en').map(setOf);
    const hg = byCell(engine, p, 'hg').map(setOf);
    if (!en.length || !hg.length) continue;
    const within = [];
    for (const grp of [en, hg])
      for (let i = 0; i < grp.length; i++)
        for (let j = i + 1; j < grp.length; j++) within.push(jaccard(grp[i], grp[j]));
    const cross = [];
    for (const a of en) for (const b of hg) cross.push(jaccard(a, b));
    ds.push(mean(within) - mean(cross));
  }
  const n = ds.length;
  const observed = mean(ds);
  let ge = 0;
  const total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (mask & (1 << i)) ? -ds[i] : ds[i];
    if (s / n >= observed - 1e-12) ge++;
  }
  return { nPrompts: n, perPromptDeltas: ds, observedMeanDelta: observed, exactP: ge / total };
}

// ---------- overlap machinery (works for any set-valued field) ----------
function overlapStats(setOf, promptFilter = PROMPTS) {
  // returns per-engine within/cross pair lists, keyed for bootstrap by prompt
  const out = {};
  for (const e of ENGINES) {
    const perPrompt = {};
    for (const p of promptFilter) {
      const en = byCell(e, p, 'en').map(setOf);
      const hg = byCell(e, p, 'hg').map(setOf);
      const within = [];
      for (const grp of [en, hg])
        for (let i = 0; i < grp.length; i++)
          for (let j = i + 1; j < grp.length; j++) within.push(jaccard(grp[i], grp[j]));
      const cross = [];
      for (const a of en) for (const b of hg) cross.push(jaccard(a, b));
      perPrompt[p] = { within, cross };
    }
    out[e] = perPrompt;
  }
  return out;
}
function summarizeOverlap(perEngine) {
  const rand = mulberry32(SEED);
  const summary = {};
  for (const e of ENGINES) {
    const perPrompt = perEngine[e];
    const allWithin = Object.values(perPrompt).flatMap((x) => x.within);
    const allCross = Object.values(perPrompt).flatMap((x) => x.cross);
    const delta = mean(allWithin) - mean(allCross);

    // clustered bootstrap over prompts
    const promptIds = Object.keys(perPrompt);
    const deltas = [];
    for (let b = 0; b < N_BOOT; b++) {
      const sample = Array.from({ length: promptIds.length }, () => promptIds[Math.floor(rand() * promptIds.length)]);
      const w = sample.flatMap((p) => perPrompt[p].within);
      const c = sample.flatMap((p) => perPrompt[p].cross);
      deltas.push(mean(w) - mean(c));
    }
    deltas.sort((a, b) => a - b);

    summary[e] = {
      meanWithinLangJaccard: mean(allWithin),
      meanCrossLangJaccard: mean(allCross),
      delta,
      deltaCI95: [deltas[Math.floor(N_BOOT * 0.025)], deltas[Math.floor(N_BOOT * 0.975)]],
      nWithinPairs: allWithin.length,
      nCrossPairs: allCross.length,
    };
  }
  return summary;
}
// permutation test: within each prompt×engine, shuffle the 2R responses' language labels
function permutationTest(setOf) {
  const rand = mulberry32(SEED + 1);
  const results = {};
  for (const e of ENGINES) {
    const cells = PROMPTS.map((p) => [...byCell(e, p, 'en'), ...byCell(e, p, 'hg')].map(setOf));
    const nEnPer = PROMPTS.map((p) => byCell(e, p, 'en').length);
    function statFor(labelled) {
      const within = [], cross = [];
      for (const { sets, labels } of labelled) {
        for (let i = 0; i < sets.length; i++)
          for (let j = i + 1; j < sets.length; j++) {
            const jc = jaccard(sets[i], sets[j]);
            (labels[i] === labels[j] ? within : cross).push(jc);
          }
      }
      return mean(within) - mean(cross);
    }
    const baseLabels = cells.map((sets, k) => ({
      sets,
      labels: sets.map((_, i) => (i < nEnPer[k] ? 'en' : 'hg')),
    }));
    const observed = statFor(baseLabels);
    let ge = 0;
    for (let it = 0; it < N_PERM; it++) {
      const perm = baseLabels.map(({ sets, labels }) => {
        const l = [...labels];
        for (let i = l.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [l[i], l[j]] = [l[j], l[i]];
        }
        return { sets, labels: l };
      });
      if (statFor(perm) >= observed) ge++;
    }
    results[e] = { observedDelta: observed, pValue: (ge + 1) / (N_PERM + 1) };
  }
  return results;
}

const brandSet = (r) => new Set(r.brands);
const domainSet = (r) => new Set(r.citationDomains);

// ---------- aggregates ----------
function brandVisibility() {
  const out = {};
  for (const e of ENGINES) {
    out[e] = {};
    for (const lang of ['en', 'hg']) {
      const rs = responses.filter((r) => r.engine === e && r.lang === lang);
      const brands = {};
      for (const b of lexicon.brands.map((x) => x.canonical)) {
        const k = rs.filter((r) => r.brands.includes(b)).length;
        if (k > 0) brands[b] = { k, n: rs.length, ...wilson(k, rs.length) };
      }
      out[e][lang] = Object.fromEntries(Object.entries(brands).sort((a, b) => b[1].k - a[1].k));
    }
  }
  return out;
}
function firstMentionAgreement() {
  const out = {};
  for (const e of ENGINES) {
    let wSame = 0, wTot = 0, cSame = 0, cTot = 0;
    for (const p of PROMPTS) {
      const en = byCell(e, p, 'en'), hg = byCell(e, p, 'hg');
      for (const grp of [en, hg])
        for (let i = 0; i < grp.length; i++)
          for (let j = i + 1; j < grp.length; j++) {
            wTot++;
            if (grp[i].firstBrand && grp[i].firstBrand === grp[j].firstBrand) wSame++;
          }
      for (const a of en) for (const b of hg) {
        cTot++;
        if (a.firstBrand && a.firstBrand === b.firstBrand) cSame++;
      }
    }
    out[e] = { within: wilson(wSame, wTot), cross: wilson(cSame, cTot) };
  }
  return out;
}
function simpleShares(field, predicate) {
  const out = {};
  for (const e of ENGINES) {
    out[e] = {};
    for (const lang of ['en', 'hg']) {
      const rs = responses.filter((r) => r.engine === e && r.lang === lang);
      const k = rs.filter(predicate).length;
      out[e][lang] = { k, n: rs.length, ...wilson(k, rs.length) };
    }
  }
  return out;
}
function meansBy(fieldFn) {
  const out = {};
  for (const e of ENGINES) {
    out[e] = {};
    for (const lang of ['en', 'hg']) {
      const vals = responses.filter((r) => r.engine === e && r.lang === lang).map(fieldFn).filter((v) => v != null);
      out[e][lang] = { mean: mean(vals), n: vals.length };
    }
  }
  return out;
}
function answerLanguageTable() {
  const out = {};
  for (const e of ENGINES) {
    out[e] = {};
    for (const lang of ['en', 'hg']) {
      const rs = responses.filter((r) => r.engine === e && r.lang === lang);
      out[e][lang] = rs.reduce((acc, r) => ((acc[r.answerLanguage] = (acc[r.answerLanguage] ?? 0) + 1), acc), {});
    }
  }
  return out;
}

const brandOverlap = overlapStats(brandSet);
const domainOverlap = overlapStats(domainSet);

const CATEGORIES = { skincare: PROMPTS.filter((p) => p.startsWith('S')), fashion: PROMPTS.filter((p) => p.startsWith('F')) };
function signFlipAll(setOf) {
  const out = {};
  for (const e of ENGINES) {
    out[e] = { pooled: signFlipExact(setOf, PROMPTS, e) };
    for (const [cat, ps] of Object.entries(CATEGORIES)) out[e][cat] = signFlipExact(setOf, ps, e);
  }
  return out;
}
function top3Visibility() {
  const out = {};
  for (const e of ENGINES) {
    out[e] = {};
    for (const lang of ['en', 'hg']) {
      const rs = responses.filter((r) => r.engine === e && r.lang === lang);
      const brands = {};
      for (const b of lexicon.brands.map((x) => x.canonical)) {
        const k = rs.filter((r) => r.top3Brands.includes(b)).length;
        if (k > 0) brands[b] = { k, n: rs.length, ...wilson(k, rs.length) };
      }
      out[e][lang] = Object.fromEntries(Object.entries(brands).sort((a, b) => b[1].k - a[1].k));
    }
  }
  return out;
}
function nykaaFlag() {
  const out = {};
  for (const e of ENGINES) {
    out[e] = {};
    for (const lang of ['en', 'hg']) {
      const rs = responses.filter((r) => r.engine === e && r.lang === lang);
      out[e][lang] = {
        inText: wilson(rs.filter((r) => r.nykaaInText).length, rs.length),
        cited: wilson(rs.filter((r) => r.nykaaCited).length, rs.length),
      };
    }
  }
  return out;
}

// No wall-clock timestamp in this file on purpose: results.json is the study's
// verifiable artifact, so its bytes must be reproducible from the raw corpus by
// anyone. Provenance lives in the git history and in each raw response's own
// timestamps. Verify with: shasum -a 256 data/analysis/results.json
const results = {
  nResponses: responses.length,
  seed: SEED, nBoot: N_BOOT, nPerm: N_PERM,
  counts: Object.fromEntries(ENGINES.map((e) => [e, { en: responses.filter((r) => r.engine === e && r.lang === 'en').length, hg: responses.filter((r) => r.engine === e && r.lang === 'hg').length }])),
  totalCostUsd: responses.reduce((s, r) => s + (r.costUsd ?? 0), 0),
  rq1_brands: {
    visibility: brandVisibility(),
    top3Visibility: top3Visibility(),
    overlap: summarizeOverlap(brandOverlap),
    signFlipExact: signFlipAll(brandSet),
    permutationSensitivity: permutationTest(brandSet),
    firstMentionAgreement: firstMentionAgreement(),
    indiaOriginShare: meansBy((r) => r.indiaOriginShare),
    brandsPerResponse: meansBy((r) => r.brands.length),
    nykaaIntegrationFlag: nykaaFlag(),
  },
  rq2_citations: {
    hasCitations: simpleShares('nCitations', (r) => r.nCitations > 0),
    meanCitations: meansBy((r) => r.nCitations),
    overlap: summarizeOverlap(domainOverlap),
    signFlipExact: signFlipAll(domainSet),
    permutationSensitivity: permutationTest(domainSet),
    inTldShare: meansBy((r) => r.inTldShare),
    domainClassMix: (() => {
      const out = {};
      for (const e of ENGINES) {
        out[e] = {};
        for (const lang of ['en', 'hg']) {
          const rs = responses.filter((r) => r.engine === e && r.lang === lang);
          const agg = {};
          for (const r of rs) for (const [cls, n] of Object.entries(r.domainClassCounts)) agg[cls] = (agg[cls] ?? 0) + n;
          out[e][lang] = agg;
        }
      }
      return out;
    })(),
  },
  rq3_answerLanguage: answerLanguageTable(),
  responseLength: meansBy((r) => r.textLength),
};

fs.writeFileSync(path.join(ANA_DIR, 'results.json'), JSON.stringify(results, null, 1));

// ---------- console summary ----------
const pct = (x) => (x == null ? 'n/a' : (100 * x).toFixed(1) + '%');
console.log(`\n=== ${responses.length} responses analyzed, total spend $${results.totalCostUsd.toFixed(2)} ===\n`);
for (const e of ENGINES) {
  const b = results.rq1_brands.overlap[e];
  const sf = results.rq1_brands.signFlipExact[e].pooled;
  const d = results.rq2_citations.overlap[e];
  const fm = results.rq1_brands.firstMentionAgreement[e];
  console.log(`--- ${e} ---`);
  console.log(`RQ1 brand-set Jaccard: within-lang ${pct(b.meanWithinLangJaccard)} vs cross-lang ${pct(b.meanCrossLangJaccard)}  Δ=${pct(b.delta)} CI[${pct(b.deltaCI95[0])},${pct(b.deltaCI95[1])}] exact sign-flip p=${sf.exactP.toFixed(4)}`);
  console.log(`RQ1 first-mention agreement: within ${pct(fm.within.p)} vs cross ${pct(fm.cross.p)}`);
  console.log(`RQ2 domain-set Jaccard: within ${pct(d.meanWithinLangJaccard)} vs cross ${pct(d.meanCrossLangJaccard)}  Δ=${pct(d.delta)} exact sign-flip p=${results.rq2_citations.signFlipExact[e].pooled.exactP.toFixed(4)}`);
  const hc = results.rq2_citations.hasCitations[e];
  console.log(`RQ2 has-citations: EN ${pct(hc.en.p)} vs HG ${pct(hc.hg.p)}   mean cites: EN ${results.rq2_citations.meanCitations[e].en.mean?.toFixed(1)} HG ${results.rq2_citations.meanCitations[e].hg.mean?.toFixed(1)}`);
  console.log(`RQ3 answer language: EN-prompted ${JSON.stringify(results.rq3_answerLanguage[e].en)} | HG-prompted ${JSON.stringify(results.rq3_answerLanguage[e].hg)}`);
  console.log(`India-origin brand share: EN ${pct(results.rq1_brands.indiaOriginShare[e].en.mean)} HG ${pct(results.rq1_brands.indiaOriginShare[e].hg.mean)}\n`);
}
console.log('Full detail → data/analysis/results.json');
