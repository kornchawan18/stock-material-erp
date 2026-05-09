import { useEffect, useState, useCallback } from 'react'
import { getMaterials } from '../api/api'

export default function StockBalance() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ search: '', category: '', stock: '' })
  const [loading, setLoading] = useState(false)
  const PAGE_SIZE = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getMaterials({ ...filters, limit: PAGE_SIZE, page })
      setRows(r.data.data); setTotal(r.data.total)
    } finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { load() }, [load])
  const set = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }
  const maxQty = Math.max(...rows.map(r => r.qty), 1)
  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Stock Balance</div><div className="page-subtitle">ยอดคงเหลือสต็อควัสดุ</div></div>
      </div>
      <div className="card">
        <div className="filter-bar">
          <div className="fg" style={{flex:1}}><label>ค้นหา</label><input className="fin fin-search" value={filters.search} onChange={e=>set('search',e.target.value)} placeholder="Part No., Description..." /></div>
          <div className="fg"><label>Category</label><select className="fin fin-select" value={filters.category} onChange={e=>set('category',e.target.value)}><option value="">ทั้งหมด</option><option>PIP</option><option>STR</option><option>INS</option></select></div>
          <div className="fg"><label>สถานะ</label><select className="fin fin-select" value={filters.stock} onChange={e=>set('stock',e.target.value)}><option value="">ทั้งหมด</option><option value="ok">ปกติ</option><option value="low">ต่ำกว่า Min</option><option value="zero">หมด</option></select></div>
          <button className="btn btn-outline btn-sm" onClick={()=>{setFilters({search:'',category:'',stock:''});setPage(1)}}>✕ ล้าง</button>
        </div>

        {loading ? <div className="loading"><div className="spinner"/>กำลังโหลด...</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Part No.</th><th>Cat</th><th>Group</th><th>Description</th><th style={{textAlign:'center'}}>Qty</th><th>Unit</th><th style={{textAlign:'center'}}>Min Stock</th><th>Location</th><th>สถานะ</th><th>Stock Bar</th></tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan="10"><div className="empty-state"><div className="empty-icon">📋</div><p>ไม่พบข้อมูล</p></div></td></tr>
                  : rows.map(m => {
                    const pct = Math.min(m.qty / maxQty * 100, 100)
                    const barCls = m.qty === 0 ? 'low' : m.min_stock > 0 && m.qty <= m.min_stock ? 'med' : 'high'
                    const status = m.qty === 0 ? ['chip-zero','หมดสต็อค'] : m.min_stock > 0 && m.qty <= m.min_stock ? ['chip-low','ต่ำกว่า Min'] : ['chip-ok','ปกติ']
                    return (
                      <tr key={m.id}>
                        <td className="mono">{m.part_no}</td>
                        <td><span className={`chip chip-${m.category}`}>{m.category}</span></td>
                        <td>{m.grp}</td>
                        <td className="desc-cell" title={m.description}>{m.description}</td>
                        <td style={{textAlign:'center',fontWeight:700}}>{m.qty?.toLocaleString()}</td>
                        <td>{m.unit}</td>
                        <td style={{textAlign:'center'}}>{m.min_stock||0}</td>
                        <td>{m.location||'-'}</td>
                        <td><span className={`chip ${status[0]}`}>{status[1]}</span></td>
                        <td><div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div className="stock-bar-wrap"><div className={`stock-bar ${barCls}`} style={{width:`${pct}%`}} /></div>
                        </div></td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
        <div className="pager">
          <span className="pager-info">รวม {total.toLocaleString()} รายการ</span>
          <div className="pager-btns">
            <button className="pg-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
            {Array.from({length:Math.min(pages,7)},(_,i)=>i+1).map(p=><button key={p} className={`pg-btn${p===page?' active':''}`} onClick={()=>setPage(p)}>{p}</button>)}
            <button className="pg-btn" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>›</button>
          </div>
        </div>
      </div>
    </>
  )
}
