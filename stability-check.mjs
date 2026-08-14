#!/usr/bin/env node
// Temporal stability spot-check (§9): S01 + F02, reps 9-10 collected ~30-60
// minutes after the primary window. Two questions:
//  (a) Direction: does within-language similarity still exceed cross-language
//      similarity in the fresh cells alone?
//  (b) Drift: are fresh-vs-primary same-language Jaccards comparable to the
//      primary window's own rerun Jaccards (i.e. no material drift)?

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(HERE, 'data', 'raw');
const STAB = path.join(HERE, 'data', 'raw-stability');
const ANA = path.join(HERE, 'data', 'analysis');

const lexicon = JSON.parse(fs.readFileSync(path.join(ANA, 'brand-lexicon.json'), 'utf8'));
const matchers = lexicon.brands.map((b) => ({
  canonical: b.canonical,
  context: b.context_regex ? new RegExp(b.context_regex, 'i') : null,
  res: [b.canonical, ...(b.aliases ?? [])].map(
    (a) =>
      new RegExp(
        `(?<![A-Za-z0-9])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9])${b.exclude_following ? `(?!${b.exclude_following})` : ''}`,
        b.risky_alias ? 'g' : 'gi',
      ),
  ),
}));
function brandSet(text) {
  const out = new Set();
  for (const bm of matchers) {
    for (const re of bm.res) {
      re.lastIndex = 0;
      let m, hit = false;
      while ((m = re.exec(text)) !== null) {
        if (!bm.context || bm.context.test(text.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80))) { hit = true; break; }
      }
      if (hit) { out.add(bm.canonical); break; }
    }
  }
  return out;
}
const jaccard = (a, b) => {
  if (a.size === 0 && b.size === 0) return 1;
  const inter = [...a].filter((x) => b.has(x)).length;
  return inter / (a.size + b.size - inter);
};
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

function load(dir, filter) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.includes('.failed.') && filter(f)).map((f) => {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return { ...d.meta, set: brandSet(d.response.text) };
  });
}
const PROMPTS = ['S01', 'F02'];
const fresh = load(STAB, () => true);
const primary = load(RAW, (f) => PROMPTS.some((p) => f.startsWith(p + '_')));

const ENGINES = ['chatgpt', 'gemini', 'perplexity'];
const out = {};
for (const e of ENGINES) {
  const freshWithin = [], freshCross = [], driftPairs = [], primaryWithin = [];
  for (const p of PROMPTS) {
    const fEn = fresh.filter((r) => r.engine === e && r.promptId === p && r.lang === 'en').map((r) => r.set);
    const fHg = fresh.filter((r) => r.engine === e && r.promptId === p && r.lang === 'hg').map((r) => r.set);
    const pEn = primary.filter((r) => r.engine === e && r.promptId === p && r.lang === 'en').map((r) => r.set);
    const pHg = primary.filter((r) => r.engine === e && r.promptId === p && r.lang === 'hg').map((r) => r.set);
    for (const grp of [fEn, fHg])
      for (let i = 0; i < grp.length; i++)
        for (let j = i + 1; j < grp.length; j++) freshWithin.push(jaccard(grp[i], grp[j]));
    for (const a of fEn) for (const b of fHg) freshCross.push(jaccard(a, b));
    for (const [f, pr] of [[fEn, pEn], [fHg, pHg]])
      for (const a of f) for (const b of pr) driftPairs.push(jaccard(a, b));
    for (const grp of [pEn, pHg])
      for (let i = 0; i < grp.length; i++)
        for (let j = i + 1; j < grp.length; j++) primaryWithin.push(jaccard(grp[i], grp[j]));
  }
  out[e] = {
    freshWithinLang: mean(freshWithin),
    freshCrossLang: mean(freshCross),
    directionHolds: mean(freshWithin) > mean(freshCross),
    freshVsPrimarySameLang: mean(driftPairs),
    primaryWithinLang: mean(primaryWithin),
    driftRatio: mean(driftPairs) / mean(primaryWithin),
    nFresh: fresh.filter((r) => r.engine === e).length,
  };
}
fs.writeFileSync(path.join(ANA, 'stability.json'), JSON.stringify({ prompts: PROMPTS, engines: out }, null, 1));
const pct = (x) => (x == null ? 'n/a' : (100 * x).toFixed(1) + '%');
for (const e of ENGINES) {
  const s = out[e];
  console.log(`${e}: fresh within ${pct(s.freshWithinLang)} vs cross ${pct(s.freshCrossLang)} → direction ${s.directionHolds ? 'HOLDS' : 'REVERSED'} | fresh-vs-primary same-lang ${pct(s.freshVsPrimarySameLang)} vs primary rerun ${pct(s.primaryWithinLang)} (drift ratio ${s.driftRatio.toFixed(2)})`);
}
