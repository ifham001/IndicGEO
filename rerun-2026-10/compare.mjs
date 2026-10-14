#!/usr/bin/env node
// August 2026 vs October 2026: did the language effect survive, and how much did
// the answers themselves move in two months? Reads both waves' analysis outputs
// (results.json + responses.json, produced by the same analyze.mjs and lexicon) and
// writes data/analysis/comparison.json plus COMPARISON.md.
//
//   node compare.mjs            (August at the repository root, October here)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const load = (dir, f) => JSON.parse(fs.readFileSync(path.join(dir, 'data', 'analysis', f), 'utf8'))
const A = { label: 'August 2026', results: load(path.join(HERE, '..'), 'results.json'), responses: load(path.join(HERE, '..'), 'responses.json') }
const B = { label: 'October 2026', results: load(HERE, 'results.json'), responses: load(HERE, 'responses.json') }
const ENGINES = ['chatgpt', 'gemini', 'perplexity']
const r1 = (x) => Math.round(x * 10) / 10
const pct1 = (x) => r1(x * 100)
const jaccard = (a, b) => { const sa = new Set(a), sb = new Set(b); if (!sa.size && !sb.size) return 1; let i = 0; for (const x of sa) if (sb.has(x)) i++; return i / (sa.size + sb.size - i) }
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN)

// 1. Headline numbers, both waves
const headline = {}
for (const e of ENGINES) {
  const row = (W) => {
    const r = W.results, ov = r.rq1_brands.overlap[e], dov = r.rq2_citations.overlap[e], hc = r.rq2_citations.hasCitations[e]
    return {
      brandWithin: pct1(ov.meanWithinLangJaccard), brandCross: pct1(ov.meanCrossLangJaccard), brandGap: pct1(ov.delta), brandCI: ov.deltaCI95.map(pct1), brandP: r.rq1_brands.signFlipExact[e].pooled.exactP,
      domainWithin: pct1(dov.meanWithinLangJaccard), domainCross: pct1(dov.meanCrossLangJaccard), domainGap: pct1(dov.delta), domainP: r.rq2_citations.signFlipExact[e].pooled.exactP,
      citedEnPct: pct1(hc.en.p), citedHgPct: pct1(hc.hg.p), citedEnK: hc.en.k, citedHgK: hc.hg.k, n: hc.en.n,
      meanCitesEn: r1(r.rq2_citations.meanCitations[e].en.mean), meanCitesHg: r1(r.rq2_citations.meanCitations[e].hg.mean),
      lenEn: Math.round(r.responseLength[e].en.mean), lenHg: Math.round(r.responseLength[e].hg.mean),
      firstWithin: pct1(r.rq1_brands.firstMentionAgreement[e].within.p), firstCross: pct1(r.rq1_brands.firstMentionAgreement[e].cross.p),
      indiaEn: pct1(r.rq1_brands.indiaOriginShare[e].en.mean), indiaHg: pct1(r.rq1_brands.indiaOriginShare[e].hg.mean),
      brandsPerResponseEn: r1(r.rq1_brands.brandsPerResponse[e].en.mean), brandsPerResponseHg: r1(r.rq1_brands.brandsPerResponse[e].hg.mean),
      answerLangHg: r.rq3_answerLanguage[e].hg,
    }
  }
  headline[e] = { aug: row(A), oct: row(B) }
}

// 2. Does each August claim still hold in October?
const claims = []
for (const e of ENGINES) {
  const a = headline[e].aug, b = headline[e].oct
  claims.push({ claim: `${e}: brand lists differ more across languages than across reruns (gap > 0, exact p < .05)`, aug: `${a.brandGap} pts, p=${a.brandP}`, oct: `${b.brandGap} pts, p=${b.brandP}`, holds: b.brandGap > 0 && b.brandP < 0.05 })
  claims.push({ claim: `${e}: cited domains differ more across languages than across reruns (gap > 0, exact p < .05)`, aug: `${a.domainGap} pts, p=${a.domainP}`, oct: `${b.domainGap} pts, p=${b.domainP}`, holds: b.domainGap > 0 && b.domainP < 0.05 })
}
const gapA = ENGINES.map((e) => [e, headline[e].aug.brandGap]).sort((x, y) => y[1] - x[1]).map((x) => x[0])
const gapB = ENGINES.map((e) => [e, headline[e].oct.brandGap]).sort((x, y) => y[1] - x[1]).map((x) => x[0])
claims.push({ claim: 'Engine order by brand gap (most to least language-sensitive)', aug: gapA.join(' > '), oct: gapB.join(' > '), holds: gapA.join() === gapB.join() })
claims.push({ claim: 'Gemini cites far less often in Hinglish than in English', aug: `${headline.gemini.aug.citedEnPct}% vs ${headline.gemini.aug.citedHgPct}% (gap ${r1(headline.gemini.aug.citedEnPct - headline.gemini.aug.citedHgPct)} pts)`, oct: `${headline.gemini.oct.citedEnPct}% vs ${headline.gemini.oct.citedHgPct}% (gap ${r1(headline.gemini.oct.citedEnPct - headline.gemini.oct.citedHgPct)} pts)`, holds: headline.gemini.oct.citedEnPct - headline.gemini.oct.citedHgPct >= 20 })
claims.push({ claim: 'ChatGPT and Perplexity cite in every answer in both languages', aug: `${headline.chatgpt.aug.citedEnPct}/${headline.chatgpt.aug.citedHgPct} and ${headline.perplexity.aug.citedEnPct}/${headline.perplexity.aug.citedHgPct}`, oct: `${headline.chatgpt.oct.citedEnPct}/${headline.chatgpt.oct.citedHgPct} and ${headline.perplexity.oct.citedEnPct}/${headline.perplexity.oct.citedHgPct}`, holds: [headline.chatgpt.oct, headline.perplexity.oct].every((x) => x.citedEnPct >= 95 && x.citedHgPct >= 95) })

// 3. Drift across the two months, per engine and language: Jaccard between every
//    August rep and every October rep of the same prompt (brand sets), against each
//    wave's own rerun Jaccard. driftRatio = crossWave / mean(withinA, withinB).
const key = (x) => `${x.promptId}|${x.lang}|${x.engine}`
const group = (W) => { const g = {}; for (const x of W.responses) (g[key(x)] ??= []).push(x); return g }
const gA = group(A), gB = group(B)
const drift = {}
for (const e of ENGINES) for (const lang of ['en', 'hg']) {
  const cross = [], withinA = [], withinB = []
  for (const k of Object.keys(gA)) {
    if (!k.endsWith(`|${lang}|${e}`) || !gB[k]) continue
    const a = gA[k], b = gB[k]
    for (const x of a) for (const y of b) cross.push(jaccard(x.brands, y.brands))
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) withinA.push(jaccard(a[i].brands, a[j].brands))
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) withinB.push(jaccard(b[i].brands, b[j].brands))
  }
  const cw = mean(cross), wa = mean(withinA), wb = mean(withinB)
  drift[`${e}.${lang}`] = { crossWaveJaccard: pct1(cw), withinAug: pct1(wa), withinOct: pct1(wb), driftRatio: Math.round((cw / ((wa + wb) / 2)) * 100) / 100, nPairs: cross.length }
}

// 4. Brand visibility over time (same language): biggest movers Aug -> Oct, per engine
const visOverTime = {}
for (const e of ENGINES) for (const lang of ['en', 'hg']) {
  const va = A.results.rq1_brands.visibility[e][lang], vb = B.results.rq1_brands.visibility[e][lang]
  const brands = new Set([...Object.keys(va), ...Object.keys(vb)])
  const rows = [...brands].map((br) => { const a = va[br]?.k ?? 0, b = vb[br]?.k ?? 0; return { brand: br, augK: a, octK: b, aug: pct1(a / 80), oct: pct1(b / 80), delta: pct1((b - a) / 80) } })
  rows.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta) || x.brand.localeCompare(y.brand))
  const newEntrants = rows.filter((x) => x.augK === 0 && x.octK >= 8).map((x) => `${x.brand} (${x.octK}/80)`)
  const gone = rows.filter((x) => x.octK === 0 && x.augK >= 8).map((x) => `${x.brand} (${x.augK}/80)`)
  visOverTime[`${e}.${lang}`] = { topMovers: rows.slice(0, 8), newEntrants, gone, top5Aug: Object.entries(va).sort((x, y) => y[1].k - x[1].k).slice(0, 5).map(([b, v]) => `${b} ${v.k}`), top5Oct: Object.entries(vb).sort((x, y) => y[1].k - x[1].k).slice(0, 5).map(([b, v]) => `${b} ${v.k}`) }
}

// 5. Did August's Hinglish movers move the same way in October?
const moverPersistence = {}
for (const e of ENGINES) {
  const va = A.results.rq1_brands.visibility[e], vb = B.results.rq1_brands.visibility[e]
  const d = (v, br) => ((v.hg[br]?.k ?? 0) - (v.en[br]?.k ?? 0))
  const brands = new Set([...Object.keys(va.en), ...Object.keys(va.hg)])
  const augMovers = [...brands].map((br) => ({ brand: br, augDelta: d(va, br), octDelta: d(vb, br) })).filter((x) => Math.abs(x.augDelta) >= 5).sort((x, y) => Math.abs(y.augDelta) - Math.abs(x.augDelta)).slice(0, 10)
  moverPersistence[e] = augMovers.map((x) => ({ ...x, sameDirection: x.octDelta === 0 ? null : Math.sign(x.octDelta) === Math.sign(x.augDelta) }))
}

// 6. Cited domains, both waves (counted once per answer that cites the domain)
const domains = { aug: A.results.citedDomains.byResponsesCiting.slice(0, 12), oct: B.results.citedDomains.byResponsesCiting.slice(0, 12), totalOccurrences: { aug: A.results.citedDomains.totalOccurrences, oct: B.results.citedDomains.totalOccurrences } }

const out = { generated: 'compare.mjs, 13 Oct 2026', waves: { aug: { n: A.results.nResponses, cost: A.results.totalCostUsd }, oct: { n: B.results.nResponses, cost: B.results.totalCostUsd } }, headline, claims, drift, visOverTime, moverPersistence, domains }
fs.writeFileSync(path.join(HERE, 'data', 'analysis', 'comparison.json'), JSON.stringify(out, null, 1))

// Markdown
const md = []
md.push('# August 2026 vs October 2026: is the Hinglish gap still there?\n')
md.push(`August: ${A.results.nResponses} answers, $${A.results.totalCostUsd}. October: ${B.results.nResponses} answers, $${B.results.totalCostUsd}. Same 10 prompts, engines, India geolocation, 8 reps, lexicon and analysis code.\n`)
md.push('## Headline numbers\n')
md.push('| Engine | Wave | Rerun brand overlap | Cross-language | Gap (pts) | 95% CI | exact p | Domain gap (pts) | p | Cites EN | Cites HG | Mean cites EN/HG | Chars EN/HG |')
md.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for (const e of ENGINES) for (const w of ['aug', 'oct']) { const h = headline[e][w]; md.push(`| ${e} | ${w === 'aug' ? 'Aug' : 'Oct'} | ${h.brandWithin}% | ${h.brandCross}% | **${h.brandGap}** | [${h.brandCI.join(', ')}] | ${h.brandP} | ${h.domainGap} | ${h.domainP} | ${h.citedEnPct}% (${h.citedEnK}/${h.n}) | ${h.citedHgPct}% (${h.citedHgK}/${h.n}) | ${h.meanCitesEn} / ${h.meanCitesHg} | ${h.lenEn} / ${h.lenHg} |`) }
md.push('\n## Do the August claims hold?\n')
md.push('| Claim | August | October | Holds |'); md.push('|---|---|---|---|')
for (const c of claims) md.push(`| ${c.claim} | ${c.aug} | ${c.oct} | ${c.holds ? 'yes' : 'NO'} |`)
md.push('\n## Drift over two months (same language, same prompt): Aug reps vs Oct reps\n')
md.push('| Engine.lang | Aug-vs-Oct Jaccard | Rerun Jaccard Aug | Rerun Jaccard Oct | Drift ratio (1.0 = no more change than a rerun) |'); md.push('|---|---|---|---|---|')
for (const [k, v] of Object.entries(drift)) md.push(`| ${k} | ${v.crossWaveJaccard}% | ${v.withinAug}% | ${v.withinOct}% | ${v.driftRatio} |`)
md.push('\n## Brands that moved most between August and October (share of 80 answers)\n')
for (const [k, v] of Object.entries(visOverTime)) { md.push(`**${k}** top 5 Aug: ${v.top5Aug.join(', ')} | top 5 Oct: ${v.top5Oct.join(', ')}`); md.push(''); md.push('| Brand | Aug | Oct | Δ |'); md.push('|---|---|---|---|'); for (const m of v.topMovers) md.push(`| ${m.brand} | ${m.aug}% (${m.augK}) | ${m.oct}% (${m.octK}) | ${m.delta > 0 ? '+' : ''}${m.delta} |`); if (v.newEntrants.length) md.push(`\nNew in October (0 in Aug, ≥8/80 in Oct): ${v.newEntrants.join('; ')}`); if (v.gone.length) md.push(`Gone in October (≥8/80 in Aug, 0 in Oct): ${v.gone.join('; ')}`); md.push('') }
md.push('## Did August\'s Hinglish movers move the same way in October? (HG minus EN answers out of 80)\n')
for (const e of ENGINES) { md.push(`**${e}**`); md.push(''); md.push('| Brand | Aug HG−EN | Oct HG−EN | Same direction |'); md.push('|---|---|---|---|'); for (const m of moverPersistence[e]) md.push(`| ${m.brand} | ${m.augDelta > 0 ? '+' : ''}${m.augDelta} | ${m.octDelta > 0 ? '+' : ''}${m.octDelta} | ${m.sameDirection === null ? 'flat' : m.sameDirection ? 'yes' : 'NO'} |`); md.push('') }
md.push('## Most-cited domains (answers citing the domain at least once, all 480 per wave)\n')
md.push('| # | August | October |'); md.push('|---|---|---|')
for (let i = 0; i < 12; i++) md.push(`| ${i + 1} | ${domains.aug[i] ? `${domains.aug[i].domain} ${domains.aug[i].count}` : ''} | ${domains.oct[i] ? `${domains.oct[i].domain} ${domains.oct[i].count}` : ''} |`)
md.push(`\nCitation occurrences in all: August ${domains.totalOccurrences.aug}, October ${domains.totalOccurrences.oct}.`)
fs.writeFileSync(path.join(HERE, 'COMPARISON.md'), md.join('\n') + '\n')
console.log('wrote data/analysis/comparison.json and COMPARISON.md')
console.log(claims.map((c) => `${c.holds ? 'HOLDS ' : 'BROKEN'} ${c.claim}: Aug ${c.aug} | Oct ${c.oct}`).join('\n'))
