import { useEffect, useState, useCallback } from 'react'
import { getTransactions } from '../api/api'

export default function TxLog() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ search: '', type: '', date_from: '', date_to: '' })
  const [loading, setLoading] = useState(false)
  const PAGE_SIZE = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getTransactions({ ...filters, limit: PAGE_SIZE, page })
      setRows(r.data.data); setTotal(r.data.total)
    } finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { load() }, [load])
  const set = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }
  const pages = Math.ceil(total / PAGE_SIZE)

  function exportCSV() {
    const cols = ['date','doc_no','type','part_no','description','qty','unit','dept','note','user']
    const header = cols.join(',')
    const csvRows = rows.map(r => cols.map(c => `"${String(r[c]??'').replace(/"/g,'""')}"`).join(','))
    const blob = new Blob(['﻿' + [header,...csvRows].join('\n')], {type:'text/csv;charset=utf-8;'})
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">ประวัติ Transaction</div><div className="page-subtitle">บันทึกการเคลื่อนไหวสต็อคทั้งหมด</div></div>
        <button className="btn btn-outline btn-sm" onClick={exportCSV}>↓ Export CSV</button>
      </div>
      <div className="card">
        <div className="filter-bar">
          <div className="fg" style={{flex:1}}><label>ค้นหา</label><input className="fin fin-search" value={filters.search} onChange={e=>set('search',e.target.value)} placeholder="Part No., Doc No., หมายเหตุ..." /></div>
          <div className="fg"><label>ประเภท</label><select className="fin fin-select" value={filters.type} onChange={e=>set('type',e.target.value)}><option value="">ทั้งหมด</option><option value="IN">รับเข้า (IN)</option><option value="OUT">เบิกออก (OUT)</option><option value="ADJ">ปรับปรุง (ADJ)</option></select></div>
          <div className="fg"><label>จากวันที่</label><input className="fin" type="date" value={filters.date_from} onChange={e=>set('date_from',e.target.value)} /></div>
          <div className="fg"><label>ถึงวันที่</label><input className="fin" type="date" value={filters.date_to} onChange={e=>set('date_to',e.target.value)} /></div>
          <button className="btn btn-outline btn-sm" onClick={()=>{setFilters({search:'',type:'',date_from:'',date_to:''});setPage(1)}}>✕ ล้าง</button>
        </div>

        {loading ? <div className="loading"><div className="spinner"/>กำลังโหลด...</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>วันที่</th><th>Doc No.</th><th>ประเภท</th><th>Part No.</th><th>Description</th><th style={{textAlign:'center'}}>Qty</th><th>Unit</th><th>หน่วยงาน</th><th>หมายเหตุ</th></tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan="9"><div className="empty-state"><div className="empty-icon">📄</div><p>ไม่พบ Transaction</p></div></td></tr>
                  : rows.map(t => (
                    <tr key={t.id}>
                      <td style={{whiteSpace:'nowrap'}}>{t.date}</td>
                      <td className="mono" style={{fontSize:'0.78rem'}}>{t.doc_no}</td>
                      <td><span className={`chip chip-${t.type}`}>{t.type==='IN'?'⬆ รับเข้า':t.type==='OUT'?'⬇ เบิกออก':'⚙ ปรับปรุง'}</span></td>
                      <td className="mono" style={{fontSize:'0.78rem'}}>{t.part_no}</td>
                      <td className="desc-cell" title={t.description}>{t.description}</td>
                      <td style={{textAlign:'center',fontWeight:700,color:t.type==='IN'?'var(--success)':'var(--danger)'}}>{t.type==='IN'?'+':'-'}{t.qty}</td>
                      <td>{t.unit}</td>
                      <td>{t.dept||'-'}</td>
                      <td>{t.note||'-'}</td>
                    </tr>
                  ))}
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
