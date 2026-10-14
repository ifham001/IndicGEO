// Lexicon v1.2 (13 Oct 2026): v1.1 plus the product brands that the October corpus
// names in 8 or more answers and v1.1 does not know. Curated by hand from
// lexicon-candidates.json and probe-brands.cjs; same entry shape as v1.1. Used only
// for the sensitivity check in v12-aug/ and v12-oct/; the primary comparison keeps
// v1.1 on both waves so August's published numbers stay untouched.
const fs = require('fs')
const path = require('path')
const src = JSON.parse(fs.readFileSync('data/analysis/brand-lexicon.json', 'utf8'))
if (src.version !== '1.1') throw new Error('expected v1.1 as the base, got ' + src.version)
const add = [
  { canonical: 'Himalaya', aliases: ['Himalaya Herbals', 'Himalaya Wellness'], india_origin: true, category: 'skincare', risky_alias: true, context_regex: '(face|wash|neem|skin|cream|moistur|cleanser|purifying)', note: 'v1.2: the mountain range is a common word; counted only near a skincare product word.' },
  { canonical: "Dr. Sheth's", aliases: ["Dr Sheth's", 'Dr. Sheth', 'Dr Sheth'], india_origin: true, category: 'skincare' },
  { canonical: 'Venusia', aliases: ['Venusia Max'], india_origin: true, category: 'skincare' },
  { canonical: 'Indo Era', aliases: [], india_origin: true, category: 'fashion' },
  { canonical: 'Lakmé', aliases: ['Lakme'], india_origin: true, category: 'skincare' },
  { canonical: 'Marks & Spencer', aliases: ['Marks and Spencer', 'M&S'], india_origin: false, category: 'fashion', risky_alias: true },
  { canonical: 'KALINI', aliases: ['Kalini'], india_origin: true, category: 'fashion' },
  { canonical: 'The Indian Garage Co', aliases: ['Indian Garage Co', 'The Indian Garage Co.'], india_origin: true, category: 'fashion' },
  { canonical: 'Turtle', aliases: [], india_origin: true, category: 'fashion', risky_alias: true, context_regex: '(shirt|formal|men|wear|brand)', note: 'v1.2: the animal is a common word; counted only near a clothing word.' },
  { canonical: 'GoSriKi', aliases: ['Gosriki'], india_origin: true, category: 'fashion' },
  { canonical: 'Mamaearth', aliases: ['Mama Earth'], india_origin: true, category: 'skincare' },
]
const have = new Set(src.brands.map((b) => b.canonical.toLowerCase()))
const brands = src.brands.concat(add.filter((b) => !have.has(b.canonical.toLowerCase())))
const out = { ...src, version: '1.2', curation_rules: [...src.curation_rules, 'v1.2 (13 Oct 2026, October re-run): 11 brands added that the October corpus names in 8 or more answers and v1.1 did not list. Added for the sensitivity check only; the primary August-vs-October comparison uses v1.1 on both waves.'], brands }
fs.writeFileSync('data/analysis/brand-lexicon-v1.2.json', JSON.stringify(out, null, 1))
console.log(`v1.2: ${brands.length} brands (${brands.length - src.brands.length} added)`)
// Sensitivity folders: same analyze.mjs, same raw files, v1.2 lexicon.
for (const [name, from] of [['v12-oct', '.'], ['v12-aug', '..']]) {
  fs.mkdirSync(path.join(name, 'data', 'analysis'), { recursive: true })
  fs.mkdirSync(path.join(name, 'data', 'raw'), { recursive: true })
  fs.copyFileSync('analyze.mjs', path.join(name, 'analyze.mjs'))
  fs.copyFileSync('data/analysis/brand-lexicon-v1.2.json', path.join(name, 'data', 'analysis', 'brand-lexicon.json'))
  fs.copyFileSync('data/analysis/domain-classes.json', path.join(name, 'data', 'analysis', 'domain-classes.json'))
  let n = 0
  for (const f of fs.readdirSync(path.join(from, 'data', 'raw'))) if (f.endsWith('.json') && !f.includes('.failed.')) { fs.copyFileSync(path.join(from, 'data', 'raw', f), path.join(name, 'data', 'raw', f)); n++ }
  console.log(`${name}: ${n} raw files staged`)
}
