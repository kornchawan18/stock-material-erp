import db from './database.js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// Look for seed file in backend/data or project root data/
const paths = [
  join(__dir, '../../data/material_data.json'),
  join(__dir, '../../../data/material_data.json'),
]
const jsonPath = paths.find(p => existsSync(p))
if (!jsonPath) { console.log('material_data.json not found, skipping seed.'); process.exit(0) }

if (db.data.materials.length > 0) {
  console.log('Already seeded:', db.data.materials.length, 'materials.')
  process.exit(0)
}

const raw = JSON.parse(readFileSync(jsonPath, 'utf8'))
db.data.materials = raw.map((r, i) => ({
  id: i + 1,
  part_no:     r['Part No.']       || '',
  category:    r['Category']        || '',
  grp:         r['Group']           || '',
  brand:       r['Brand']           || '',
  size:        r['Size']            || '',
  materials:   r['Materials']       || '',
  pressure:    r['Pressure Rating'] || '',
  description: r['Description']     || '',
  qty: 0, unit: 'EA', min_stock: 0, location: '',
  created_at: r['Date'] || new Date().toISOString().slice(0, 10),
}))
db.data._nextMatId = raw.length + 1
await db.write()
console.log('Seeded', db.data.materials.length, 'materials.')
