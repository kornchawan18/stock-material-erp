import { useState, useCallback, useEffect } from 'react'
import { getMaterials, receiveStock } from '../api/api'
import { useToast } from '../App'

export default function Receive() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('')
  const [cart, setCart] = useState({})
  const [docNo, setDocNo] = useState('GR-' + new Date().toISOString().slice(0,10) + '-001')
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const PAGE = 30

  const load = useCallback(async () => {
    const r = await getMaterials({ search, category: cat, limit: PAGE, page })
    setRows(r.data.data); setTotal(r.data.total)
  }, [search, cat, page])

  useEffect(() => { load() }, [load])

  const toggle = (m) => setCart(c => c[m.id] ? (({ [m.id]: _, ...rest }) => rest)(c) : { ...c, [m.id]: { mat: m, qty: 1 } })
  const setQty = (id, qty) => setCart(c => ({ ...c, [id]: { ...c[id], qty: Math.max(1, qty) } }))
  const cartItems = Object.values(cart)
  const pages = Math.ceil(total / PAGE)

  async function submit() {
    if (!cartItems.length) { toast('กรุณาเลือกรายการ', 'error'); return }
    setLoading(true)
    try {
      await receiveStock({ items: cartItems.map(x => ({ mat_id: x.mat.id, qty: x.qty })), doc_no: docNo, date, note })
      toast(`บันทึกรับเข้า ${cartItems.length} รายการ สำเร็จ`, 'success')
      setCart({}); setDocNo('GR-' + new Date().toISOString().slice(0,10) + '-' + String(Date.now()).slice(-3)); setNote('')
      load()
    } catch(e) { toast(e.response?.data?.error || 'เกิดข้อผิดพลาด', 'error') }
    finally { setLoading(false) }
  }

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">⬆ รับวัสดุเข้า (Goods Receipt)</div><div className="page-subtitle">บันทึกการรับวัสดุเข้าคลัง</div></div>
      </div>
      <div className="gr-layout">
        <div className="card">
          <div className="card-header"><span className="card-title">เลือกรายการวัสดุ</span></div>
          <div className="card-body">
            <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
              <input className="fin fin-search" style={{flex:1}} value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="ค้นหา Part No. / Description..." />
              <select className="fin fin-select" value={cat} onChange={e=>{setCat(e.target.value);setPage(1)}}><option value="">Category ทั้งหมด</option><option>PIP</option><option>STR</option><option>INS</option></select>
            </div>
            <div className="table-wrap" style={{maxHeight:420,overflowY:'auto'}}>
              <table>
                <thead><tr><th style={{width:40}}></th><th>Part No.</th><th>Cat</th><th>Group</th><th>Description</th><th style={{textAlign:'center'}}>Qty</th></tr></thead>
                <tbody>
                  {rows.map(m => {
                    const inCart = !!cart[m.id]
                    return (
                      <tr key={m.id} style={inCart?{background:'#f0fdf4'}:{}}>
                        <td><button className={`btn btn-sm ${inCart?'btn-success':'btn-outline'}`} onClick={()=>toggle(m)}>{inCart?'✓':'+'}</button></td>
                        <td className="mono">{m.part_no}</td>
                        <td><span className={`chip chip-${m.category}`}>{m.category}</span></td>
                        <td>{m.grp}</td>
                        <td className="desc-cell" title={m.description}>{m.description}</td>
                        <td style={{textAlign:'center',fontWeight:700}}>{m.qty?.toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span className="pager-info">รวม {total.toLocaleString()} รายการ</span>
              <div className="pager-btns">
                <button className="pg-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
                {Array.from({length:Math.min(pages,5)},(_,i)=>i+1).map(p=><button key={p} className={`pg-btn${p===page?' active':''}`} onClick={()=>setPage(p)}>{p}</button>)}
                <button className="pg-btn" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>›</button>
              </div>
            </div>
          </div>
        </div>

        <div className="card sticky-card">
          <div className="card-header"><span className="card-title">📋 รายการรับเข้า ({cartItems.length})</span></div>
          <div className="card-body">
            {cartItems.length === 0
              ? <div className="empty-state" style={{padding:'30px 10px'}}><p>คลิกรายการทางซ้ายเพื่อเพิ่ม</p></div>
              : <div style={{maxHeight:280,overflowY:'auto'}}>
                  {cartItems.map(({ mat, qty }) => (
                    <div key={mat.id} className="cart-item">
                      <div className="cart-item-info">
                        <div className="cart-partno">{mat.part_no}</div>
                        <div className="cart-desc">{mat.description}</div>
                      </div>
                      <input className="qty-input" type="number" min="1" value={qty} onChange={e=>setQty(mat.id,+e.target.value)} />
                      <button className="btn btn-danger btn-sm btn-icon" onClick={()=>toggle(mat)}>✕</button>
                    </div>
                  ))}
                </div>
            }
            <div className="divider" />
            <div className="form-group" style={{marginBottom:10}}>
              <label className="form-label">เลขที่เอกสาร</label>
              <input className="form-control" value={docNo} onChange={e=>setDocNo(e.target.value)} />
            </div>
            <div className="form-group" style={{marginBottom:10}}>
              <label className="form-label">วันที่รับ</label>
              <input className="form-control" type="date" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
            <div className="form-group" style={{marginBottom:16}}>
              <label className="form-label">หมายเหตุ</label>
              <textarea className="form-control" rows="2" value={note} onChange={e=>setNote(e.target.value)} />
            </div>
            <button className="btn btn-success" style={{width:'100%'}} onClick={submit} disabled={loading}>
              {loading ? '...' : '✓ บันทึกรับเข้า'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
