#!/usr/bin/env node
// Builds the data file the study page reads for its October 2026 re-run section:
// the page-shaped engine numbers (same exporter as the August file) plus the
// August-vs-October comparison the page quotes. Output goes to the depra tree.
//
//   node export-rerun-json.mjs            (after analyze.mjs, stability-check.mjs, compare.mjs)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const page = JSON.parse(fs.readFileSync(path.join(HERE, 'data', 'analysis', 'page-oct.json'), 'utf8'))
const cmp = JSON.parse(fs.readFileSync(path.join(HERE, 'data', 'analysis', 'comparison.json'), 'utf8'))
const v12 = JSON.parse(fs.readFileSync(path.join(HERE, 'v12-oct', 'data', 'analysis', 'results.json'), 'utf8'))
const v12aug = JSON.parse(fs.readFileSync(path.join(HERE, 'v12-aug', 'data', 'analysis', 'results.json'), 'utf8'))
const log = fs.readFileSync(path.join(HERE, 'data', 'run-full.log'), 'utf8')
const times = [...log.matchAll(/^\[(\d{4}-\d\d-\d\dT\d\d:\d\d)/gm)].map((m) => m[1])
const pct1 = (x) => Math.round(x * 1000) / 10
const sens = {}
for (const e of ['chatgpt', 'gemini', 'perplexity']) sens[e] = { octGapV12: pct1(v12.rq1_brands.overlap[e].delta), octPV12: v12.rq1_brands.signFlipExact[e].pooled.exactP, augGapV12: pct1(v12aug.rq1_brands.overlap[e].delta), augPV12: v12aug.rq1_brands.signFlipExact[e].pooled.exactP }
const out = {
  generatedFrom: 'research/hinglish-rerun-2026-10-13 (export-rerun-json.mjs): analyze.mjs with the August lexicon v1.1, compare.mjs, stability-check.mjs',
  fieldwork: '2026-10-13',
  windowUtc: { start: times[0], end: times[times.length - 1] },
  nResponses: page.nResponses,
  totalCostUsd: page.totalCostUsd,
  failedCells: 1,
  engines: page.engines,
  claims: cmp.claims,
  drift: cmp.drift,
  movers: Object.fromEntries(Object.entries(cmp.visOverTime).map(([k, v]) => [k, { topMovers: v.topMovers.slice(0, 6), newEntrants: v.newEntrants, gone: v.gone }])),
  domains: { aug: cmp.domains.aug.slice(0, 10), oct: cmp.domains.oct.slice(0, 10), totalOccurrences: cmp.domains.totalOccurrences },
  lexiconSensitivity: sens,
  lexiconV12Added: 11,
}
const dest = path.join(HERE, 'data', 'analysis', 'page-rerun.json') // the file the depra.ai study page reads
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n')
console.log(`wrote ${dest}: ${out.nResponses} responses, window ${out.windowUtc.start} to ${out.windowUtc.end} UTC`)
