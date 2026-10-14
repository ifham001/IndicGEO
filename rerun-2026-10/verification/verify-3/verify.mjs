import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:/Claude code/AEO GEO website/research/hinglish-rerun-2026-10-13';
const OCT = path.join(ROOT, 'data/raw');
const AUG = path.join(ROOT, 'original/data/raw');
const lex = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/analysis/brand-lexicon.json'), 'utf8'));
const prompts = JSON.parse(fs.readFileSync(path.join(ROOT, 'prompts.json'), 'utf8')).prompts.map(p => p.id);

const anomalies = [];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Build matchers
const matchers = lex.brands.map(b => {
  const names = [b.canonical, ...(b.aliases || [])];
  const flags = 'gu' + (b.risky_alias ? '' : 'i');
  const re = new RegExp('(?<![\\p{L}\\p{N}])(?:' + names.map(esc).join('|') + ')(?![\\p{L}\\p{N}])', flags);
  const ctx = b.context_regex ? new RegExp(b.context_regex, 'iu') : null;
  const excl = b.exclude_following ? new RegExp('^(?:' + b.exclude_following + ')', 'u') : null;
  return { canonical: b.canonical, re, ctx, excl };
});

function brandSet(text, opts = {}) {
  const set = new Set();
  for (const m of matchers) {
    if (opts.noBareW && m.canonical === 'W') {
      const re2 = /(?<![\p{L}\p{N}])(?:W for Woman|W for Women)(?![\p{L}\p{N}])/gu;
      if (re2.test(text)) set.add('W');
      continue;
    }
    m.re.lastIndex = 0;
    let hit;
    while ((hit = m.re.exec(text)) !== null) {
      const start = hit.index, end = start + hit[0].length;
      if (m.excl && m.excl.test(text.slice(end))) continue;
      if (m.ctx) {
        const window = text.slice(Math.max(0, start - 80), Math.min(text.length, end + 80));
        if (!m.ctx.test(window)) continue;
      }
      set.add(m.canonical);
      break;
    }
  }
  return set;
}

function load(dir, label) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    if (f.includes('.failed.')) { anomalies.push(`${label}: skipped failed file ${f}`); continue; }
    const m = /^([A-Z]\d{2})_(en|hg)_(chatgpt|gemini|perplexity)_r(\d+)\.json$/.exec(f);
    if (!m) { anomalies.push(`${label}: unparseable filename ${f}`); continue; }
    const rep = +m[4];
    if (rep < 1 || rep > 8) { anomalies.push(`${label}: rep out of range ${f}`); continue; }
    let j;
    try { j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { anomalies.push(`${label}: JSON parse error ${f}: ${e.message}`); continue; }
    const text = j?.response?.text;
    if (typeof text !== 'string') anomalies.push(`${label}: response.text not a string in ${f}`);
    if (typeof text === 'string' && text.trim().length === 0) anomalies.push(`${label}: empty response.text in ${f}`);
    const cits = j?.response?.citations;
    if (!Array.isArray(cits)) anomalies.push(`${label}: response.citations not an array in ${f} (${typeof cits})`);
    if (!prompts.includes(m[1])) anomalies.push(`${label}: unknown prompt id ${m[1]} in ${f}`);
    out.push({ file: f, prompt: m[1], lang: m[2], engine: m[3], rep, text: text || '', citations: Array.isArray(cits) ? cits : [], brands: brandSet(text || ''), brandsNoW: brandSet(text || '', { noBareW: true }) });
  }
  return out;
}

const oct = load(OCT, 'oct');
const aug = load(AUG, 'aug');
console.log('n_answers_oct', oct.length, 'n_answers_aug', aug.length);

const jac = (a, b) => { if (a.size === 0 && b.size === 0) return 1; let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); };
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const pct = x => Math.round(x * 1000) / 10;

const engines = ['chatgpt', 'gemini', 'perplexity'];
const byKey = (arr) => { const m = new Map(); for (const r of arr) { const k = `${r.prompt}|${r.lang}|${r.engine}`; (m.get(k) || m.set(k, []).get(k)).push(r); } return m; };
const octMap = byKey(oct), augMap = byKey(aug);
const get = (m, p, l, e) => (m.get(`${p}|${l}|${e}`) || []).slice().sort((a, b) => a.rep - b.rep);

const results = {};
for (const field of ['brands', 'brandsNoW']) {
  for (const e of engines) {
    const within = [], cross = [];
    for (const p of prompts) {
      for (const l of ['en', 'hg']) {
        const reps = get(octMap, p, l, e);
        for (let i = 0; i < reps.length; i++) for (let j = i + 1; j < reps.length; j++) within.push(jac(reps[i][field], reps[j][field]));
      }
      const en = get(octMap, p, 'en', e), hg = get(octMap, p, 'hg', e);
      for (const a of en) for (const b of hg) cross.push(jac(a[field], b[field]));
    }
    results[`${field}_${e}_within`] = { n: within.length, pct: pct(mean(within)), raw: mean(within) };
    results[`${field}_${e}_cross`] = { n: cross.length, pct: pct(mean(cross)), raw: mean(cross) };
  }
}
console.log(JSON.stringify(results, null, 1));

// Gemini cited, complete-pair rule
const cited = r => r.citations.some(c => c && typeof c.url === 'string' && c.url.trim().length > 0);
const gem = { en: { k: 0, n: 0 }, hg: { k: 0, n: 0 } };
let dropped = [];
for (const p of prompts) {
  const en = get(octMap, p, 'en', 'gemini'), hg = get(octMap, p, 'hg', 'gemini');
  for (let rep = 1; rep <= 8; rep++) {
    const a = en.find(r => r.rep === rep), b = hg.find(r => r.rep === rep);
    if (!a || !b) { dropped.push(`${p} r${rep} (missing ${!a ? 'en' : 'hg'})`); continue; }
    gem.en.n++; gem.hg.n++; if (cited(a)) gem.en.k++; if (cited(b)) gem.hg.k++;
  }
}
console.log('gemini cited', JSON.stringify(gem), 'dropped pairs:', dropped.join('; '));
const citedAll = {};
for (const r of oct) { const k = `${r.engine}_${r.lang}`; citedAll[k] = citedAll[k] || { k: 0, n: 0 }; citedAll[k].n++; if (cited(r)) citedAll[k].k++; }
console.log('cited all (no pair rule)', JSON.stringify(citedAll));

// Devanagari
let dev = 0; const devFiles = [];
for (const r of oct.filter(r => r.engine === 'perplexity' && r.lang === 'hg')) {
  const d = (r.text.match(/[\u0900-\u097F]/g) || []).length;
  const lat = (r.text.match(/[A-Za-z]/g) || []).length;
  if (d > lat) { dev++; devFiles.push(r.file); }
}
console.log('perplexity hg devanagari', dev, devFiles.join(','));
const devAny = {};
for (const r of oct) { const d = (r.text.match(/[\u0900-\u097F]/g) || []).length; const lat = (r.text.match(/[A-Za-z]/g) || []).length; if (d > lat) { devAny[r.engine + '_' + r.lang] = (devAny[r.engine + '_' + r.lang] || 0) + 1; } }
console.log('devanagari-majority by engine_lang', JSON.stringify(devAny));

// Top cited domain by distinct answers
function regDomain(url) {
  let h;
  try { h = new URL(url).hostname.toLowerCase(); } catch { return null; }
  h = h.replace(/^www\./, '');
  h = h.replace(/^\d+\./, '');
  h = h.replace(/^www\./, '');
  return h;
}
const domAnswers = new Map();
let badUrls = 0;
for (const r of oct) {
  const seen = new Set();
  for (const c of r.citations) {
    if (!c || typeof c.url !== 'string' || !c.url.trim()) continue;
    const d = regDomain(c.url.trim());
    if (!d) { badUrls++; continue; }
    seen.add(d);
  }
  for (const d of seen) domAnswers.set(d, (domAnswers.get(d) || 0) + 1);
}
const top = [...domAnswers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log('top domains (distinct answers)', JSON.stringify(top), 'unparseable urls', badUrls);
const hostAnswers = new Map();
for (const r of oct) { const seen = new Set(); for (const c of r.citations) { try { seen.add(new URL(c.url).hostname.toLowerCase()); } catch {} } for (const h of seen) hostAnswers.set(h, (hostAnswers.get(h) || 0) + 1); }
console.log('top raw hosts', JSON.stringify([...hostAnswers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)));

// Perplexity EN Aug vs Oct
for (const field of ['brands', 'brandsNoW']) {
  const pairs = [], rerun = [];
  for (const p of prompts) {
    const a = get(augMap, p, 'en', 'perplexity'), o = get(octMap, p, 'en', 'perplexity');
    for (const x of a) for (const y of o) pairs.push(jac(x[field], y[field]));
    for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++) rerun.push(jac(o[i][field], o[j][field]));
  }
  console.log(field, 'pplx en aug-vs-oct', pairs.length, pct(mean(pairs)), mean(pairs), 'oct rerun', rerun.length, pct(mean(rerun)), mean(rerun));
}

// Diagnostics
const wHits = oct.filter(r => r.brands.has('W') && !r.brandsNoW.has('W')).map(r => r.file);
console.log('bare-W-only matches (oct)', wHits.length, wHits.join(','));
const wHitsAug = aug.filter(r => r.brands.has('W') && !r.brandsNoW.has('W')).map(r => r.file);
console.log('bare-W-only matches (aug)', wHitsAug.length, wHitsAug.join(','));
const empty = oct.filter(r => r.brands.size === 0).map(r => r.file);
console.log('empty brand sets oct', empty.length, empty.join(','));
const emptyAug = aug.filter(r => r.brands.size === 0).map(r => r.file);
console.log('empty brand sets aug', emptyAug.length, emptyAug.join(','));
const sizes = {}; for (const r of oct) { const k = r.engine + '_' + r.lang; sizes[k] = sizes[k] || []; sizes[k].push(r.brands.size); }
for (const k in sizes) console.log('mean brands', k, (mean(sizes[k])).toFixed(2));
const shortTexts = oct.filter(r => r.text.length < 200).map(r => r.file + ':' + r.text.length);
console.log('short texts (<200 chars) oct', shortTexts.length, shortTexts.join(','));
console.log('ANOMALIES', anomalies.length, anomalies.join(' | '));
