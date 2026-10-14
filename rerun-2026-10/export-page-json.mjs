#!/usr/bin/env node
// Maps a study's data/analysis/results.json (+ stability.json when present) to the
// flat JSON the depra.ai study page reads (src/landing/data/research-hinglish.json).
// Written 13 Oct 2026 for the October re-run; validated by reproducing the August
// file from the August results (see validate step in README).
//
//   node export-page-json.mjs <studyDir> <out.json> [generatedFromLabel]
import fs from 'node:fs'
import path from 'node:path'

const [studyDir, outFile, label] = process.argv.slice(2)
if (!studyDir || !outFile) { console.error('usage: export-page-json.mjs <studyDir> <out.json> [label]'); process.exit(1) }
const ana = path.join(studyDir, 'data', 'analysis')
const r = JSON.parse(fs.readFileSync(path.join(ana, 'results.json'), 'utf8'))
const stabFile = path.join(ana, 'stability.json')
const stab = fs.existsSync(stabFile) ? JSON.parse(fs.readFileSync(stabFile, 'utf8')) : null

const r1 = (x) => Math.round(x * 10) / 10
const r2 = (x) => Math.round(x * 100) / 100
const pct1 = (x) => r1(x * 100)

const engines = {}
for (const e of ['chatgpt', 'gemini', 'perplexity']) {
  const ov = r.rq1_brands.overlap[e], sf = r.rq1_brands.signFlipExact[e]
  const dov = r.rq2_citations.overlap[e], dsf = r.rq2_citations.signFlipExact[e]
  const hc = r.rq2_citations.hasCitations[e], mc = r.rq2_citations.meanCitations[e]
  const fm = r.rq1_brands.firstMentionAgreement[e], io = r.rq1_brands.indiaOriginShare[e]
  const vis = r.rq1_brands.visibility[e]
  const brands = new Set([...Object.keys(vis.en), ...Object.keys(vis.hg)])
  const movers = [...brands]
    .map((b) => {
      const en = vis.en[b] ?? { k: 0, n: hc.en.n }, hg = vis.hg[b] ?? { k: 0, n: hc.hg.n }
      const enP = pct1(en.k / en.n), hgP = pct1(hg.k / hg.n)
      return { brand: b, enK: en.k, hgK: hg.k, en: enP, hg: hgP, delta: r1(hgP - enP) }
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.brand.localeCompare(b.brand))
    .slice(0, 10)
  const st = stab?.engines?.[e]
  engines[e] = {
    brandWithin: pct1(ov.meanWithinLangJaccard), brandCross: pct1(ov.meanCrossLangJaccard), brandGap: pct1(ov.delta),
    brandCI: ov.deltaCI95.map(pct1), brandP: sf.pooled.exactP,
    skincareGap: pct1(sf.skincare.observedMeanDelta), skincareP: sf.skincare.exactP,
    fashionGap: pct1(sf.fashion.observedMeanDelta), fashionP: sf.fashion.exactP,
    domainWithin: pct1(dov.meanWithinLangJaccard), domainCross: pct1(dov.meanCrossLangJaccard), domainGap: pct1(dov.delta), domainP: dsf.pooled.exactP,
    citedEnK: hc.en.k, citedHgK: hc.hg.k, n: hc.en.n, citedEnPct: pct1(hc.en.p), citedHgPct: pct1(hc.hg.p),
    // 13 Oct 2026: analyze.mjs reports n per arm; the October Gemini Hinglish arm has all 80 answers (45 cited, 56.3%), a strict complete-pair count gives 44 of 79 (55.7%).
    citedEnN: hc.en.n, citedHgN: hc.hg.n,
    meanCitesEn: r1(mc.en.mean), meanCitesHg: r1(mc.hg.mean),
    lenEn: Math.round(r.responseLength[e].en.mean), lenHg: Math.round(r.responseLength[e].hg.mean),
    firstWithin: pct1(fm.within.p), firstCross: pct1(fm.cross.p),
    indiaEn: pct1(io.en.mean), indiaHg: pct1(io.hg.mean),
    answerLangEn: r.rq3_answerLanguage[e].en, answerLangHg: r.rq3_answerLanguage[e].hg,
    stability: st ? { freshWithin: pct1(st.freshWithinLang), freshCross: pct1(st.freshCrossLang), driftRatio: r2(st.driftRatio) } : null,
    movers,
  }
}
const out = { generatedFrom: label ?? path.relative(process.cwd(), path.join(ana, 'results.json')).split(path.sep).join('/'), nResponses: r.nResponses, totalCostUsd: r2(r.totalCostUsd), engines }
fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n')
console.log(`wrote ${outFile}: ${r.nResponses} responses, $${out.totalCostUsd}`)
