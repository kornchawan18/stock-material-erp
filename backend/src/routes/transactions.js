import { Router } from 'express'
import db from '../db/database.js'

const router = Router()

router.get('/', (req, res) => {
  const { search, type, date_from, date_to, limit = 50, page = 1 } = req.query
  let txs = [...db.data.transactions].sort((a, b) => b.id - a.id)
  if (type)      txs = txs.filter(t => t.type === type)
  if (date_from) txs = txs.filter(t => t.date >= date_from)
  if (date_to)   txs = txs.filter(t => t.date <= date_to)
  if (search) {
    const s = search.toLowerCase()
    txs = txs.filter(t => `${t.part_no} ${t.doc_no} ${t.note} ${t.dept}`.toLowerCase().includes(s))
  }
  const total = txs.length
  const offset = (Number(page) - 1) * Number(limit)
  res.json({ total, page: Number(page), limit: Number(limit), data: txs.slice(offset, offset + Number(limit)) })
})

router.post('/receive', async (req, res) => {
  const { items, doc_no, date, note } = req.body
  if (!items?.length) return res.status(400).json({ error: 'No items' })
  const d = date || new Date().toISOString().slice(0, 10)
  const docNo = doc_no || 'GR-' + Date.now()
  try {
    for (const item of items) {
      const mat = db.data.materials.find(m => m.id === item.mat_id)
      if (!mat) throw new Error('Material not found: ' + item.mat_id)
      mat.qty += Number(item.qty)
      db.data.transactions.push({ id: db.data._nextTxId++, date: d, doc_no: docNo, type: 'IN', part_no: mat.part_no, description: mat.description, qty: Number(item.qty), unit: mat.unit, dept: '', note: note || '', user: 'Admin', mat_id: item.mat_id, created_at: new Date().toISOString() })
    }
    await db.write()
    res.json({ ok: true, doc_no: docNo })
  } catch(e) { res.status(400).json({ error: e.message }) }
})

router.post('/issue', async (req, res) => {
  const { items, doc_no, date, note, dept } = req.body
  if (!items?.length) return res.status(400).json({ error: 'No items' })
  const d = date || new Date().toISOString().slice(0, 10)
  const docNo = doc_no || 'GI-' + Date.now()
  for (const item of items) {
    const mat = db.data.materials.find(m => m.id === item.mat_id)
    if (!mat) return res.status(400).json({ error: 'Material not found: ' + item.mat_id })
    if (mat.qty < item.qty) return res.status(400).json({ error: `Stock ไม่เพียงพอ: ${mat.part_no} (มี ${mat.qty})` })
  }
  for (const item of items) {
    const mat = db.data.materials.find(m => m.id === item.mat_id)
    mat.qty -= Number(item.qty)
    db.data.transactions.push({ id: db.data._nextTxId++, date: d, doc_no: docNo, type: 'OUT', part_no: mat.part_no, description: mat.description, qty: Number(item.qty), unit: mat.unit, dept: dept || '', note: note || '', user: 'Admin', mat_id: item.mat_id, created_at: new Date().toISOString() })
  }
  await db.write()
  res.json({ ok: true, doc_no: docNo })
})

router.post('/adjust', async (req, res) => {
  const { mat_id, new_qty, reason } = req.body
  const mat = db.data.materials.find(m => m.id === mat_id)
  if (!mat) return res.status(404).json({ error: 'Not found' })
  const diff = new_qty - mat.qty
  mat.qty = Number(new_qty)
  db.data.transactions.push({ id: db.data._nextTxId++, date: new Date().toISOString().slice(0, 10), doc_no: 'ADJ-' + Date.now(), type: 'ADJ', part_no: mat.part_no, description: mat.description, qty: Math.abs(diff), unit: mat.unit, dept: '', note: reason || 'Stock Adjustment', user: 'Admin', mat_id, created_at: new Date().toISOString() })
  await db.write()
  res.json(mat)
})

export default router
