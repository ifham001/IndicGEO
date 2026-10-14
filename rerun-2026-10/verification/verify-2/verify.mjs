import fs from 'fs';
import path from 'path';
const ROOT = 'E:/Claude code/AEO GEO website/research/hinglish-rerun-2026-10-13';
const OCT = path.join(ROOT, 'data/raw');
const AUG = path.join(ROOT, 'original/data/raw');
const lex = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/analysis/brand-lexicon.json'), 'utf8'));
const prompts = JSON.parse(fs.readFileSync(path.join(ROOT, 'prompts.json'), 'utf8')).prompts.map(p => p.id);
const anomalies = [];

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
const matchers = lex.brands.map(b => {
  const names = [b.canonical, ...(b.aliases || [])];
  const flags = b.risky_alias ? 'g' : 'gi';
  const re = new RegExp('(?<![\\p{L}\\p{N}])(?:' + names.map(esc).join('|') + ')(?![\\p{L}\\p{N}])' + (b.exclude_following ? '(?!' + b.exclude_following + ')' : ''), flags + 'u');
  const ctx = b.context_regex ? new RegExp(b.context_regex, 'i') : null;
  return { canonical: b.canonical, re, ctx };
});
function brandSet(text) {
  const s = new Set();
  for (const m of matchers) {
    m.re.lastIndex = 0;
    let hit;
    while ((hit = m.re.exec(text)) !== null) {
      if (m.ctx) {
        const a = Math.max(0, hit.index - 80), z = Math.min(text.length, hit.index + hit[0].length + 80);
        if (!m.ctx.test(text.slice(a, z))) continue;
      }
      s.add(m.canonical); break;
    }
  }
  return s;
}
function jac(A, B) {
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0; for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}
function load(dir, label) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    if (f.includes('.failed.')) { anomalies.push(`${label}: skipped failed file ${f}`); continue; }
    const m = f.match(/^([A-Z]\d{2})_(en|hg)_(chatgpt|gemini|perplexity)_r(\d+)\.json$/);
    if (!m) { anomalies.push(`${label}: unparseable filename ${f}`); continue; }
    const rep = +m[4];
    if (rep < 1 || rep > 8) { anomalies.push(`${label}: rep out of range ${f}`); continue; }
    let j;
    try { j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { anomalies.push(`${label}: JSON parse error ${f}: ${e.message}`); continue; }
    const text = j?.response?.text;
    if (typeof text !== 'string') anomalies.push(`${label}: missing response.text in ${f}`);
    const cits = j?.response?.citations;
    if (!Array.isArray(cits)) anomalies.push(`${label}: citations not array in ${f}`);
    if (typeof text === 'string' && text.trim().length === 0) anomalies.push(`${label}: empty text in ${f}`);
    if (j?.meta && (j.meta.promptId !== m[1] || j.meta.lang !== m[2] || j.meta.engine !== m[3] || +j.meta.rep !== rep)) anomalies.push(`${label}: meta mismatch in ${f}: ${JSON.stringify(j.meta)}`);
    out.push({ file: f, p: m[1], lang: m[2], eng: m[3], rep, text: text || '', cits: Array.isArray(cits) ? cits : [], brands: brandSet(text || '') });
  }
  return out;
}
const oct = load(OCT, 'oct');
const aug = load(AUG, 'aug');
const ENG = ['chatgpt', 'gemini', 'perplexity'];
const res = { n_answers_oct: oct.length, n_answers_aug: aug.length };
const get = (arr, p, lang, eng) => arr.filter(x => x.p === p && x.lang === lang && x.eng === eng).sort((a, b) => a.rep - b.rep);
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const pct = x => Math.round(x * 1000) / 10;

// within / cross
for (const eng of ENG) {
  const within = [], cross = [];
  for (const p of prompts) {
    for (const lang of ['en', 'hg']) {
      const reps = get(oct, p, lang, eng);
      for (let i = 0; i < reps.length; i++) for (let j = i + 1; j < reps.length; j++) within.push(jac(reps[i].brands, reps[j].brands));
    }
    const en = get(oct, p, 'en', eng), hg = get(oct, p, 'hg', eng);
    for (const a of en) for (const b of hg) cross.push(jac(a.brands, b.brands));
  }
  res[eng + '_within_pairs'] = within.length; res[eng + '_within_pct'] = pct(mean(within));
  res[eng + '_cross_pairs'] = cross.length; res[eng + '_cross_pct'] = pct(mean(cross));
}
// perplexity en-only within
{
  const w = [];
  for (const p of prompts) { const reps = get(oct, p, 'en', 'perplexity'); for (let i = 0; i < reps.length; i++) for (let j = i + 1; j < reps.length; j++) w.push(jac(reps[i].brands, reps[j].brands)); }
  res.perplexity_en_within_pairs = w.length; res.perplexity_en_within_pct = pct(mean(w));
}
// aug vs oct perplexity en
{
  const v = [];
  for (const p of prompts) { const a = get(aug, p, 'en', 'perplexity'), o = get(oct, p, 'en', 'perplexity'); for (const x of a) for (const y of o) v.push(jac(x.brands, y.brands)); }
  res.perplexity_aug_oct_pairs = v.length; res.perplexity_aug_oct_pct = pct(mean(v));
}
// gemini cited, complete-pair rule
const cited = x => x.cits.some(c => c && typeof c.url === 'string' && c.url.trim().length > 0);
{
  const ck = { en: [0, 0], hg: [0, 0] }; const dropped = [];
  for (const p of prompts) for (let r = 1; r <= 8; r++) {
    const en = oct.find(x => x.p === p && x.lang === 'en' && x.eng === 'gemini' && x.rep === r);
    const hg = oct.find(x => x.p === p && x.lang === 'hg' && x.eng === 'gemini' && x.rep === r);
    if (!en || !hg) { dropped.push(`${p}_r${r} (missing ${!en ? 'en' : ''}${!hg ? 'hg' : ''})`); continue; }
    ck.en[1]++; ck.hg[1]++; if (cited(en)) ck.en[0]++; if (cited(hg)) ck.hg[0]++;
  }
  res.gemini_cited = { en: ck.en, hg: ck.hg, en_pct: pct(ck.en[0] / ck.en[1]), hg_pct: pct(ck.hg[0] / ck.hg[1]), dropped };
  // also without complete-pair rule
  const all = { en: [0, 0], hg: [0, 0] };
  for (const x of oct.filter(x => x.eng === 'gemini')) { all[x.lang][1]++; if (cited(x)) all[x.lang][0]++; }
  res.gemini_cited_all_files = all;
}
// devanagari
{
  let n = 0; const list = [];
  for (const x of oct.filter(x => x.eng === 'perplexity' && x.lang === 'hg')) {
    const dev = (x.text.match(/[\u0900-\u097F]/g) || []).length;
    const lat = (x.text.match(/[A-Za-z]/g) || []).length;
    if (dev > lat) { n++; list.push(`${x.file} dev=${dev} lat=${lat}`); }
  }
  res.perplexity_hg_devanagari = n; res.devanagari_files = list;
  // any devanagari at all, across engines
  const any = oct.filter(x => /[\u0900-\u097F]/.test(x.text)).map(x => x.file);
  res.any_devanagari_files = any;
}
// top cited domain
{
  const dom = new Map(); let bad = 0;
  for (const x of oct) {
    const seen = new Set();
    for (const c of x.cits) {
      if (!c || typeof c.url !== 'string' || !c.url.trim()) continue;
      let h;
      try { h = new URL(c.url.trim()).hostname.toLowerCase(); } catch { bad++; continue; }
      h = h.replace(/^\d+\./, '').replace(/^www\./, '');
      seen.add(h);
    }
    for (const h of seen) dom.set(h, (dom.get(h) || 0) + 1);
  }
  const sorted = [...dom.entries()].sort((a, b) => b[1] - a[1]);
  res.top_domains = sorted.slice(0, 10); res.bad_urls = bad;
  // per engine too
  const byEng = {};
  for (const eng of ENG) {
    const d = new Map();
    for (const x of oct.filter(x => x.eng === eng)) {
      const seen = new Set();
      for (const c of x.cits) { try { seen.add(new URL(c.url.trim()).hostname.toLowerCase().replace(/^\d+\./, '').replace(/^www\./, '')); } catch {} }
      for (const h of seen) d.set(h, (d.get(h) || 0) + 1);
    }
    byEng[eng] = [...d.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }
  res.top_domains_by_engine = byEng;
}
// brand stats sanity
res.oct_zero_brand_answers = oct.filter(x => x.brands.size === 0).map(x => x.file);
res.oct_mean_brands = pct(mean(oct.map(x => x.brands.size))) / 100;
res.aug_zero_brand_answers = aug.filter(x => x.brands.size === 0).length;
res.anomalies = anomalies;
console.log(JSON.stringify(res, null, 1));
