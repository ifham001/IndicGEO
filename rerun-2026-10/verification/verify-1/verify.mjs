import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:/Claude code/AEO GEO website/research/hinglish-rerun-2026-10-13';
const OCT = path.join(ROOT, 'data/raw');
const AUG = path.join(ROOT, 'original/data/raw');
const LEX = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/analysis/brand-lexicon.json'), 'utf8'));
const PROMPTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'prompts.json'), 'utf8')).prompts.map(p => p.id);

const anomalies = [];
const FN = /^([A-Za-z0-9]+)_(en|hg)_(chatgpt|gemini|perplexity)_r(\d+)\.json$/;

function load(dir, label) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (f.includes('.failed.')) { anomalies.push(`${label}: skipped failed file ${f}`); continue; }
    const m = f.match(FN);
    if (!m) { anomalies.push(`${label}: filename does not match pattern: ${f}`); continue; }
    const rep = +m[4];
    if (rep < 1 || rep > 8) { anomalies.push(`${label}: rep outside 1-8: ${f}`); continue; }
    let j;
    try { j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
    catch (e) { anomalies.push(`${label}: JSON parse error ${f}: ${e.message}`); continue; }
    const text = j?.response?.text;
    const cits = j?.response?.citations;
    if (typeof text !== 'string') anomalies.push(`${label}: response.text not a string in ${f}`);
    if (!Array.isArray(cits)) anomalies.push(`${label}: response.citations not an array in ${f}`);
    if (typeof text === 'string' && text.trim().length === 0) anomalies.push(`${label}: empty text in ${f}`);
    if (!PROMPTS.includes(m[1])) anomalies.push(`${label}: promptId not in prompts.json: ${f}`);
    out.push({ file: f, prompt: m[1], lang: m[2], engine: m[3], rep, text: typeof text === 'string' ? text : '', citations: Array.isArray(cits) ? cits : [] });
  }
  return out;
}

// ---------- brand matching ----------
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchers = LEX.brands.map(b => {
  const names = [b.canonical, ...(b.aliases || [])].filter(Boolean);
  const flags = (b.risky_alias ? '' : 'i') + 'gu';
  const excl = b.exclude_following ? `(?!${b.exclude_following})` : '';
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${names.map(esc).join('|')})${excl}(?![\\p{L}\\p{N}])`, flags);
  const ctx = b.context_regex ? new RegExp(b.context_regex, 'i') : null;
  return { canonical: b.canonical, re, ctx };
});
function brandSet(text) {
  const s = new Set();
  for (const m of matchers) {
    m.re.lastIndex = 0;
    let hit;
    while ((hit = m.re.exec(text)) !== null) {
      if (hit[0].length === 0) { m.re.lastIndex++; continue; }
      if (m.ctx) {
        const a = Math.max(0, hit.index - 80), z = Math.min(text.length, hit.index + hit[0].length + 80);
        if (!m.ctx.test(text.slice(a, z))) continue;
      }
      s.add(m.canonical); break;
    }
  }
  return s;
}
const jacc = (A, B) => {
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0; for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
};
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const pct1 = x => Math.round(x * 1000) / 10;

const oct = load(OCT, 'oct');
const aug = load(AUG, 'aug');
for (const r of oct) r.brands = brandSet(r.text);
for (const r of aug) r.brands = brandSet(r.text);

const by = (rows, prompt, lang, engine) => rows.filter(r => r.prompt === prompt && r.lang === lang && r.engine === engine).sort((a, b) => a.rep - b.rep);
const ENG = ['chatgpt', 'gemini', 'perplexity'];
const res = {};

// within / cross language
for (const e of ENG) {
  const within = [], cross = [], withinEn = [];
  for (const p of PROMPTS) {
    for (const l of ['en', 'hg']) {
      const rs = by(oct, p, l, e);
      if (rs.length !== 8) anomalies.push(`oct ${p}_${l}_${e}: ${rs.length} reps`);
      for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
        const v = jacc(rs[i].brands, rs[j].brands); within.push(v); if (l === 'en') withinEn.push(v);
      }
    }
    const en = by(oct, p, 'en', e), hg = by(oct, p, 'hg', e);
    for (const a of en) for (const b of hg) cross.push(jacc(a.brands, b.brands));
  }
  res[e] = { within: pct1(mean(within)), withinPairs: within.length, cross: pct1(mean(cross)), crossPairs: cross.length, withinEn: pct1(mean(withinEn)), withinEnPairs: withinEn.length };
}

// cited (gemini), complete-pair rule
const isCited = r => r.citations.some(c => c && typeof c.url === 'string' && c.url.trim().length > 0);
const cited = {};
for (const e of ENG) {
  let kEn = 0, nEn = 0, kHg = 0, nHg = 0, dropped = [];
  for (const p of PROMPTS) for (let rep = 1; rep <= 8; rep++) {
    const a = oct.find(r => r.prompt === p && r.lang === 'en' && r.engine === e && r.rep === rep);
    const b = oct.find(r => r.prompt === p && r.lang === 'hg' && r.engine === e && r.rep === rep);
    if (!a || !b) { dropped.push(`${p}_r${rep}`); continue; }
    nEn++; nHg++; if (isCited(a)) kEn++; if (isCited(b)) kHg++;
  }
  cited[e] = { en: `${kEn}/${nEn}`, enPct: pct1(kEn / nEn), hg: `${kHg}/${nHg}`, hgPct: pct1(kHg / nHg), dropped };
}

// devanagari
const devCount = t => (t.match(/[\u0900-\u097F]/g) || []).length;
const latCount = t => (t.match(/[A-Za-z\u00C0-\u024F]/g) || []).length;
const pplHg = oct.filter(r => r.engine === 'perplexity' && r.lang === 'hg');
const devAnswers = pplHg.filter(r => devCount(r.text) > latCount(r.text));
const devByEngine = {};
for (const e of ENG) for (const l of ['en', 'hg']) devByEngine[`${e}_${l}`] = oct.filter(r => r.engine === e && r.lang === l && devCount(r.text) > latCount(r.text)).length;

// top cited domain
const TWO_LEVEL = new Set(['co.in', 'com.au', 'co.uk', 'org.uk', 'net.in', 'org.in', 'ac.in', 'gov.in', 'co.jp', 'com.sg', 'co.nz', 'com.br', 'co.za', 'com.pk', 'com.bd', 'firm.in', 'ind.in', 'gen.in', 'nic.in', 'res.in', 'edu.in']);
function hostOf(u) {
  try { return new URL(u.trim()).hostname.toLowerCase(); } catch { const m = u.match(/^(?:[a-z]+:\/\/)?([^\/?#]+)/i); return m ? m[1].toLowerCase() : null; }
}
function registrable(host) {
  let labels = host.split('.').filter(Boolean);
  while (labels.length > 2 && (labels[0] === 'www' || /^\d+$/.test(labels[0]))) labels.shift();
  if (labels.length <= 2) return labels.join('.');
  const last2 = labels.slice(-2).join('.');
  return TWO_LEVEL.has(last2) ? labels.slice(-3).join('.') : last2;
}
const domAnswers = new Map(), hostAnswers = new Map(), badUrls = [];
for (const r of oct) {
  const ds = new Set(), hs = new Set();
  for (const c of r.citations) {
    if (!c || typeof c.url !== 'string' || !c.url.trim()) continue;
    const h = hostOf(c.url); if (!h) { badUrls.push(`${r.file}: ${c.url}`); continue; }
    let hh = h.replace(/^www\./, '').replace(/^\d+\./, '');
    hs.add(hh); ds.add(registrable(h));
  }
  for (const d of ds) domAnswers.set(d, (domAnswers.get(d) || 0) + 1);
  for (const h of hs) hostAnswers.set(h, (hostAnswers.get(h) || 0) + 1);
}
const topDom = [...domAnswers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
const topHost = [...hostAnswers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

// perplexity EN aug vs oct
const augOct = [];
for (const p of PROMPTS) {
  const A = by(aug, p, 'en', 'perplexity'), O = by(oct, p, 'en', 'perplexity');
  if (A.length !== 8) anomalies.push(`aug ${p}_en_perplexity: ${A.length} reps`);
  for (const a of A) for (const o of O) augOct.push(jacc(a.brands, o.brands));
}
const augCounts = {};
for (const r of aug) { const k = `${r.engine}_${r.lang}`; augCounts[k] = (augCounts[k] || 0) + 1; }

const out = {
  n_oct: oct.length, n_aug: aug.length, augCounts,
  engines: res, cited,
  perplexity_hg_devanagari: devAnswers.length, perplexity_hg_n: pplHg.length, devByEngine,
  topDomains: topDom, topHosts: topHost, badUrls,
  ppl_en_aug_vs_oct: pct1(mean(augOct)), ppl_en_aug_vs_oct_pairs: augOct.length,
  anomalies,
};
fs.writeFileSync(path.join(ROOT, 'verify-1/verify-output.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
