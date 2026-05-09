import { Router } from 'express'
import db from '../db/database.js'

const router = Router()

router.get('/', (req, res) => {
  const mats = db.data.materials
  const txs  = db.data.transactions

  const totalMat  = mats.length
  const totalQty  = mats.reduce((s, m) => s + m.qty, 0)
  const inStock   = mats.filter(m => m.qty > 0).length
  const lowStock  = mats.filter(m => m.min_stock > 0 && m.qty <= m.min_stock && m.qty > 0).length
  const outStock  = mats.filter(m => m.qty === 0).length
  const today     = new Date().toISOString().slice(0, 10)
  const todayTx   = txs.filter(t => t.date === today).length

  const catStats = ['PIP', 'STR', 'INS'].map(cat => ({
    category:  cat,
    count:     mats.filter(m => m.category === cat).length,
    total_qty: mats.filter(m => m.category === cat).reduce((s, m) => s + m.qty, 0),
  }))

  const movement = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    movement.push({
      date: ds,
      in:  txs.filter(t => t.date === ds && t.type === 'IN').reduce((s, t) => s + t.qty, 0),
      out: txs.filter(t => t.date === ds && t.type === 'OUT').reduce((s, t) => s + t.qty, 0),
    })
  }

  const topStock  = [...mats].sort((a, b) => b.qty - a.qty).slice(0, 10)
  const recentTx  = [...txs].sort((a, b) => b.id - a.id).slice(0, 10)

  res.json({ totalMat, totalQty, inStock, lowStock, outStock, todayTx, catStats, movement, topStock, recentTx })
})

export default router
