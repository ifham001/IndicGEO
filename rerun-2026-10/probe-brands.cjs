// Curation helper (13 Oct 2026): for a list of brand names seen in the October
// candidates, say whether the August lexicon (v1.1) already matches them and how
// many October answers name them. Also lists answers that came back in another
// language (Portuguese strings were seen in the candidate scan).
const fs = require('fs')
const lex = JSON.parse(fs.readFileSync('data/analysis/brand-lexicon.json'))
const names = lex.brands.flatMap((b) => [b.canonical, ...(b.aliases || [])]).map((s) => s.toLowerCase())
const probe = ['Dr. Sheth', 'Indo Era', 'KALINI', 'Venusia', 'Indian Garage', 'GoSriKi', 'Urbano', 'Sebamed', 'Mamaearth', 'Jockey', 'Skechers', 'Peter England', 'Turtle', 'Himalaya', 'Nivea', 'Marks & Spencer', 'Lakm', 'Kiprun', 'Kalenji', 'Mochi', 'Hush Puppies', 'Woodland', 'Fila', 'Reebok', 'New Balance', 'Hoka', 'Brooks', 'Saucony', 'Olay', 'Vaseline', 'Dove', "Pond's", 'Clinique', 'Cosrx', 'Innisfree', 'Avene', 'Kaya', 'Lotus', 'Garnier', 'Neutrogena', 'Cetaphil', 'CeraVe', 'Bioderma', 'Physiogel', 'Conscious Chemist', 'Earth Rhythm', 'mCaffeine', 'Sugar', 'Biba', 'Fabindia', 'Aurelia', 'Sparx', 'Campus', 'Bata', 'Red Tape', 'Nike', 'Puma', 'adidas', 'ASICS', 'Decathlon', "Levi's", 'Wrangler', 'Pepe', 'Spykar', 'Killer', 'Flying Machine', 'Roadster', 'HRX', 'Van Heusen', 'Louis Philippe', 'Allen Solly', 'Arrow', 'Raymond', 'Park Avenue', 'Blackberrys', 'Zodiac', 'Mufti', 'Indian Terrain', 'Libas', 'Anouk', 'Sangria', 'Janasya', 'Nalli', 'Taneira', 'Kalki', 'Koskii', 'Karagiri', 'Sudathi', 'Vastranand', 'Ishin', 'Rangita', 'Mitera', 'Bunaai', 'Anubhutee', 'Minimalist', 'The Derma Co', 'Plum', 'Dot & Key', 'Deconstruct', 'Pilgrim', 'Foxtale', 'Aqualogica', "Re'equil", 'Fixderma', 'Simple', 'La Roche-Posay', 'The Ordinary', 'Isntree', 'Beauty of Joseon', 'WishCare', 'Saslic', 'Chemist At Play', 'Asaya', 'IndiSangam', 'Sarojini', 'Soch', 'Aachho', 'Global Desi', 'Ethnix', 'Rustorange', 'Varanga', 'Jaipur Kurti', 'Wooden Street']
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const raw = fs.readdirSync('data/raw').filter((f) => !f.includes('.failed.')).map((f) => { const d = JSON.parse(fs.readFileSync('data/raw/' + f)); return { f, text: d.response.text, lang: f.split('_')[1], engine: f.split('_')[2] } })
const rows = []
for (const p of probe) {
  const pl = p.toLowerCase()
  const inLex = names.some((n) => n === pl || (n.length > 3 && (n.includes(pl) || pl.includes(n))))
  const re = new RegExp('(?<![A-Za-z0-9])' + esc(p) + '(?![A-Za-z0-9])', 'i')
  const hits = raw.filter((r) => re.test(r.text))
  if (hits.length) rows.push({ p, inLex, n: hits.length, en: hits.filter((h) => h.lang === 'en').length, hg: hits.filter((h) => h.lang === 'hg').length })
}
rows.sort((a, b) => a.inLex - b.inLex || b.n - a.n)
for (const r of rows) console.log(`${r.inLex ? '   in-lex' : 'MISSING '} ${r.p.padEnd(18)} ${String(r.n).padStart(3)} answers (en ${r.en}, hg ${r.hg})`)
console.log('\n=== answers with Portuguese strings (Sapatilha / Preto / Grupo SAROS)')
for (const r of raw.filter((r) => /Sapatilha|Grupo SAROS|\bPreto\b/.test(r.text))) console.log(' ', r.f, r.text.slice(0, 160).replace(/\n/g, ' '))
console.log('\ntotal answers scanned:', raw.length)
