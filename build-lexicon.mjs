#!/usr/bin/env node
// Step 1 of brand-lexicon construction: scan every collected response and emit
// candidate brand strings with frequencies, for manual curation into
// data/analysis/brand-lexicon.json. Candidates come from (a) markdown bold
// spans, (b) markdown headers, (c) capitalized token runs. Curation (alias
// grouping, India-origin tagging, junk removal) is a human step; the OUTPUT of
// curation is published and matching against it is deterministic.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(HERE, 'data', 'raw');
const OUT = path.join(HERE, 'data', 'analysis', 'lexicon-candidates.json');

const STOP = new Set(
  `The A An And Or For With Best Top My Your Under Around Price Key Why How What Which Where When India Indian Rs INR Approx About It This That These Those Its If In On At By To From Of As Is Are Was Be Not No Yes Both All Some Any Each Most More Less Very Really Also Just Only Even Still Other Another Options Option Pick Picks Choice Recommended Recommendation Buy Buying Skin Face Wash Cleanser Serum Sunscreen Moisturizer Cream Gel Oil Shoes Jeans Shirt Shirts Kurta Saree Sarees Set Sets Brand Brands Online Budget Wedding Formal Running Men Women Winter Monsoon Oily Dry Acne Dark Spots Dull White Cast Salicylic Glycolic Lactic Hyaluronic Niacinamide Vitamin Acid AHA BHA LHA SPF PA Green Tea Tree Aloe Vera Neem Turmeric Rose Water Note Overall Daily Gentle Deep Pore Pores Cleansing Refreshing Anti Combo Pack List Order Now Available Amazon Flipkart Nykaa Myntra Ajio Purplle Meesho Blinkit Zepto Current Listings Haan Agar Aap Mein Ke Ki Ka Ko Se Liye Aur Ye Yeh Wala Wale Kuch Sabse Accha Acchi Acche`.split(/\s+/),
);
// Marketplaces excluded from STOP-as-brands? No: Amazon/Flipkart/Nykaa/Myntra/Ajio/Purplle
// are retailers, not product brands; they are tracked separately via citations.
// Kept in STOP so the lexicon stays product-brand only (documented decision).

const counts = new Map();
function add(cand, file) {
  const c = cand.trim().replace(/[*_#:,.()\[\]]+$/g, '').replace(/^[*_#:,.()\[\]]+/g, '').trim();
  if (c.length < 3 || c.length > 40) return;
  if (/^\d/.test(c)) return;
  const words = c.split(/\s+/);
  if (words.every((w) => STOP.has(w))) return;
  const key = c.toLowerCase();
  if (!counts.has(key)) counts.set(key, { display: c, n: 0, files: new Set() });
  const e = counts.get(key);
  e.n++;
  e.files.add(file);
}

const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.json') && !f.includes('.failed.'));
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(RAW_DIR, f), 'utf8'));
  const text = d.response?.text ?? '';
  for (const m of text.matchAll(/\*\*([^*\n]{3,60})\*\*/g)) add(m[1], f);
  for (const m of text.matchAll(/^#{1,4}\s*(?:\d+\.\s*)?\[?([^\n\]#]{3,60})/gm)) add(m[1], f);
  for (const m of text.matchAll(/\b([A-Z][A-Za-z&'.]+(?:\s+(?:[A-Z&][A-Za-z&'.]*|de|at|and|&)){0,3})\b/g)) add(m[1], f);
}

const out = [...counts.values()]
  .filter((e) => e.n >= 2)
  .sort((a, b) => b.n - a.n)
  .map((e) => ({ candidate: e.display, mentions: e.n, responses: e.files.size }));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generatedFrom: files.length + ' responses', candidates: out }, null, 1));
console.log(`${files.length} responses scanned, ${out.length} candidates → ${OUT}`);
console.log(out.slice(0, 60).map((c) => `${c.candidate} (${c.responses})`).join('\n'));
