import { Router } from 'express'
import db from '../db/database.js'

const router = Router()

function filterMats(q) {
  const { search, category, grp, brand, stock } = q
  return db.data.materials.filter(m => {
    if (category && m.category !== category) return false
    if (grp   && m.grp   !== grp)   return false
    if (brand && m.brand !== brand)  return false
    if (stock === 'ok'   && !(m.qty > 0 && !(m.min_stock > 0 && m.qty <= m.min_stock))) return false
    if (stock === 'low'  && !(m.min_stock > 0 && m.qty <= m.min_stock && m.qty > 0))   return false
    if (stock === 'zero' && m.qty !== 0) return false
    if (search) {
      const s = search.toLowerCase()
      const hay = `${m.part_no} ${m.description} ${m.size} ${m.grp} ${m.brand}`.toLowerCase()
      if (!hay.includes(s)) return false
    }
    return true
  })
}

router.get('/', (req, res) => {
  const { limit = 50, page = 1 } = req.query
  const all = filterMats(req.query).sort((a, b) => a.part_no.localeCompare(b.part_no))
  const total = all.length
  const offset = (Number(page) - 1) * Number(limit)
  res.json({ total, page: Number(page), limit: Number(limit), data: all.slice(offset, offset + Number(limit)) })
})

router.get('/filters', (req, res) => {
  const mats = db.data.materials
  const uniq = (fn) => [...new Set(mats.map(fn).filter(v => v && v !== 'N.A' && v !== 'nan'))].sort()
  res.json({
    groups:    uniq(m => m.grp),
    brands:    uniq(m => m.brand),
    materials: uniq(m => m.materials),
    pressures: uniq(m => m.pressure),
  })
})

router.get('/:id', (req, res) => {
  const m = db.data.materials.find(x => x.id === Number(req.params.id))
  if (!m) return res.status(404).json({ error: 'Not found' })
  const txs = db.data.transactions.filter(t => t.mat_id === m.id).sort((a, b) => b.id - a.id).slice(0, 10)
  res.json({ ...m, transactions: txs })
})

router.post('/', async (req, res) => {
  const { part_no, category } = req.body
  if (!part_no || !category) return res.status(400).json({ error: 'part_no and category required' })
  if (db.data.materials.find(m => m.part_no === part_no)) return res.status(400).json({ error: 'Part No. ซ้ำ' })
  const m = { id: db.data._nextMatId++, ...req.body, qty: 0, unit: req.body.unit || 'EA', min_stock: req.body.min_stock || 0, location: req.body.location || '', created_at: new Date().toISOString().slice(0, 10) }
  db.data.materials.push(m)
  await db.write()
  res.json(m)
})

router.put('/:id', async (req, res) => {
  const idx = db.data.materials.findIndex(x => x.id === Number(req.params.id))
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.data.materials[idx] = { ...db.data.materials[idx], ...req.body, id: Number(req.params.id) }
  await db.write()
  res.json(db.data.materials[idx])
})

router.delete('/:id', async (req, res) => {
  db.data.materials = db.data.materials.filter(x => x.id !== Number(req.params.id))
  await db.write()
  res.json({ ok: true })
})

export default router
