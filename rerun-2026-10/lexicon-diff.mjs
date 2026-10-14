#!/usr/bin/env node
// After build-lexicon.mjs: list candidate brand strings from the October corpus that
// the published lexicon (v1.1) does not match, with counts, for manual curation.
// A candidate is "matched" when any lexicon canonical or alias matches it as a word.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const lex = JSON.parse(fs.readFileSync(path.join(HERE, 'data', 'analysis', 'brand-lexicon.json'), 'utf8'))
const cands = JSON.parse(fs.readFileSync(path.join(HERE, 'data', 'analysis', 'lexicon-candidates.json'), 'utf8'))
const names = lex.brands.flatMap((b) => [b.canonical, ...(b.aliases ?? [])]).map((s) => s.toLowerCase())
const list = Array.isArray(cands) ? cands : cands.candidates ?? Object.entries(cands).map(([candidate, v]) => ({ candidate, ...(typeof v === 'object' ? v : { count: v }) }))
const min = Number(process.argv[2] ?? 3)
const rows = list
  .map((c) => ({ candidate: c.candidate ?? c.text ?? c.name, count: c.responses ?? c.count ?? c.n ?? 0, mentions: c.mentions ?? 0 }))
  .filter((c) => c.candidate && c.count >= min)
  .filter((c) => !names.some((n) => n === c.candidate.toLowerCase() || c.candidate.toLowerCase().includes(n)))
  .sort((a, b) => b.count - a.count)
console.log(`${rows.length} unmatched candidates with count >= ${min} (lexicon has ${lex.brands.length} brands)`)
for (const r of rows.slice(0, 80)) console.log(String(r.count).padStart(4), r.candidate)
