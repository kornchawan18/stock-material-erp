import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getMaterials, getMaterialFilters, getMaterial, createMaterial, updateMaterial, deleteMaterial, adjustStock } from '../api/api'
import { useToast } from '../App'

const UNITS = ['EA', 'M', 'KG', 'SET', 'BOX', 'LOT', 'PCS']
const CATS  = ['PIP', 'STR', 'INS']

function MaterialModal({ initial, filters, onSave, onClose }) {
  const [form, setForm] = useState(initial || { part_no:'',category:'',grp:'',brand:'',size:'',materials:'',pressure:'',description:'',unit:'EA',min_stock:0,location:'' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="overlay open" onClick={e => e.target.className.includes('overlay') && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">{initial?.id ? 'แก้ไขวัสดุ: ' + initial.part_no : 'เพิ่มวัสดุใหม่'}</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid form-grid-3">
            {[['Part No.','part_no','text',true],['Group','grp','text'],['Brand','brand','text'],['Size','size','text'],['Materials','materials','text'],['Pressure Rating','pressure','text'],['Location','location','text']].map(([lbl,key,type,req]) => (
              <div className="form-group" key={key}>
                <label className="form-label">{lbl}{req&&<span className="req"> *</span>}</label>
                <input className="form-control" value={form[key]||''} onChange={e => set(key, e.target.value)} readOnly={!!initial?.id && key==='part_no'} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Category <span className="req">*</span></label>
              <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">-- เลือก --</option>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-control" value={form.unit||'EA'} onChange={e => set('unit', e.target.value)}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Min Stock</label>
              <input className="form-control" type="number" min="0" value={form.min_stock||0} onChange={e => set('min_stock', +e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows="3" value={form.description||''} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>✓ บันทึก</button>
        </div>
      </div>
    </div>
  )
}

function AdjustModal({ mat, onSave, onClose }) {
  const [newQty, setNewQty] = useState(mat.qty)
  const [reason, setReason] = useState('')
  return (
    <div className="overlay open" onClick={e => e.target.className.includes('overlay') && onClose()}>
      <div className="modal">
        <div className="modal-header"><span className="modal-title">ปรับปรุงยอด Stock</span><button className="close-btn" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="info-box"><strong>{mat.part_no}</strong><br />{mat.description}</div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Qty ปัจจุบัน</label><input className="form-control" readOnly value={mat.qty} /></div>
            <div className="form-group"><label className="form-label">Qty ใหม่ <span className="req">*</span></label><input className="form-control" type="number" min="0" value={newQty} onChange={e => setNewQty(+e.target.value)} /></div>
            <div className="form-group form-full"><label className="form-label">เหตุผล <span className="req">*</span></label><textarea className="form-control" rows="2" value={reason} onChange={e => setReason(e.target.value)} /></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={() => reason.trim() && onSave(newQty, reason)}>✓ บันทึก</button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ id, onClose }) {
  const [mat, setMat] = useState(null)
  useEffect(() => { getMaterial(id).then(r => setMat(r.data)).catch(()=>{}) }, [id])
  if (!mat) return <div className="overlay open"><div className="modal"><div className="modal-body"><div className="loading"><div className="spinner"/></div></div></div></div>
  const fields = [['Part No.',mat.part_no],['Category',mat.category],['Group',mat.grp],['Brand',mat.brand],['Size',mat.size],['Materials',mat.materials],['Pressure',mat.pressure],['Unit',mat.unit],['Qty',mat.qty],['Min Stock',mat.min_stock],['Location',mat.location||'-']]
  return (
    <div className="overlay open" onClick={e => e.target.className.includes('overlay') && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header"><span className="modal-title">{mat.part_no}</span><button className="close-btn" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="form-grid form-grid-3">
            {fields.map(([k,v]) => <div key={k} className="form-group"><label className="form-label">{k}</label><input className="form-control" readOnly value={String(v??'-')} /></div>)}
            <div className="form-group form-full"><label className="form-label">Description</label><textarea className="form-control" readOnly rows="2" value={mat.description||''} /></div>
          </div>
          <div className="divider" />
          <div className="section-title">Transaction ล่าสุด</div>
          {mat.transactions?.length === 0 ? <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>ยังไม่มีประวัติ</p>
            : <div className="table-wrap"><table><thead><tr><th>วันที่</th><th>Doc No.</th><th>ประเภท</th><th>Qty</th><th>หมายเหตุ</th></tr></thead>
              <tbody>{mat.transactions?.map(t => <tr key={t.id}><td>{t.date}</td><td className="mono">{t.doc_no}</td><td><span className={`chip chip-${t.type}`}>{t.type}</span></td><td style={{fontWeight:700,color:t.type==='IN'?'var(--success)':'var(--danger)'}}>{t.type==='IN'?'+':'-'}{t.qty}</td><td>{t.note||'-'}</td></tr>)}</tbody>
            </table></div>}
        </div>
      </div>
    </div>
  )
}

export default function Materials() {
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ search: searchParams.get('search')||'', category:'', grp:'', brand:'', stock:'' })
  const [filterOpts, setFilterOpts] = useState({ groups:[], brands:[] })
  const [modal, setModal] = useState(null) // {type:'add'|'edit'|'detail'|'adjust', mat?}
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
  useEffect(() => { getMaterialFilters().then(r => setFilterOpts(r.data)).catch(()=>{}) }, [])

  const set = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }

  async function handleSave(form) {
    try {
      if (modal.mat?.id) await updateMaterial(modal.mat.id, form)
      else await createMaterial(form)
      toast(modal.mat?.id ? 'แก้ไขสำเร็จ' : 'เพิ่มวัสดุสำเร็จ', 'success')
      setModal(null); load()
    } catch(e) { toast(e.response?.data?.error || 'เกิดข้อผิดพลาด', 'error') }
  }

  async function handleDelete(id, partNo) {
    if (!confirm(`ยืนยันลบ: ${partNo}?`)) return
    try { await deleteMaterial(id); toast('ลบสำเร็จ', 'success'); load() }
    catch(e) { toast(e.response?.data?.error || 'ลบไม่สำเร็จ', 'error') }
  }

  async function handleAdjust(newQty, reason) {
    try {
      await adjustStock({ mat_id: modal.mat.id, new_qty: newQty, reason })
      toast('ปรับปรุง Stock สำเร็จ', 'success'); setModal(null); load()
    } catch(e) { toast(e.response?.data?.error || 'เกิดข้อผิดพลาด', 'error') }
  }

  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Master Material</div><div className="page-subtitle">จัดการข้อมูลวัสดุทั้งหมด</div></div>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}>＋ เพิ่มวัสดุ</button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="fg" style={{flex:1}}><label>ค้นหา</label><input className="fin fin-search" value={filters.search} onChange={e=>set('search',e.target.value)} placeholder="Part No., Description, Size..." /></div>
          <div className="fg"><label>Category</label><select className="fin fin-select" value={filters.category} onChange={e=>set('category',e.target.value)}><option value="">ทั้งหมด</option>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="fg"><label>Group</label><select className="fin fin-select" value={filters.grp} onChange={e=>set('grp',e.target.value)}><option value="">ทั้งหมด</option>{filterOpts.groups.map(g=><option key={g}>{g}</option>)}</select></div>
          <div className="fg"><label>Brand</label><select className="fin fin-select" value={filters.brand} onChange={e=>set('brand',e.target.value)}><option value="">ทั้งหมด</option>{filterOpts.brands.map(b=><option key={b}>{b}</option>)}</select></div>
          <div className="fg"><label>Stock</label><select className="fin fin-select" value={filters.stock} onChange={e=>set('stock',e.target.value)}><option value="">ทั้งหมด</option><option value="ok">มีสต็อค</option><option value="low">ต่ำกว่า Min</option><option value="zero">หมด</option></select></div>
          <button className="btn btn-outline btn-sm" onClick={()=>{setFilters({search:'',category:'',grp:'',brand:'',stock:''});setPage(1)}}>✕ ล้าง</button>
        </div>

        {loading ? <div className="loading"><div className="spinner"/>กำลังโหลด...</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Part No.</th><th>Category</th><th>Group</th><th>Brand</th>
                <th>Size</th><th>Materials</th><th>Pressure</th><th>Description</th>
                <th style={{textAlign:'center'}}>Qty</th><th>Unit</th><th>Location</th>
                <th style={{textAlign:'center'}}>Action</th>
              </tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan="12"><div className="empty-state"><div className="empty-icon">🔍</div><p>ไม่พบข้อมูล</p></div></td></tr>
                  : rows.map(m => {
                    const qCls = m.qty === 0 ? 'var(--danger)' : m.min_stock > 0 && m.qty <= m.min_stock ? 'var(--warning)' : 'var(--success)'
                    return (
                      <tr key={m.id}>
                        <td className="mono">{m.part_no}</td>
                        <td><span className={`chip chip-${m.category}`}>{m.category}</span></td>
                        <td>{m.grp}</td><td>{m.brand}</td>
                        <td style={{whiteSpace:'nowrap'}}>{m.size}</td>
                        <td>{m.materials}</td>
                        <td style={{whiteSpace:'nowrap'}}>{m.pressure}</td>
                        <td className="desc-cell" title={m.description}>{m.description}</td>
                        <td style={{textAlign:'center',fontWeight:700,color:qCls}}>{m.qty?.toLocaleString()}</td>
                        <td>{m.unit}</td><td>{m.location||'-'}</td>
                        <td>
                          <div className="btn-group">
                            <button className="btn btn-outline btn-sm btn-icon" title="ดูรายละเอียด" onClick={()=>setModal({type:'detail',mat:m})}>🔍</button>
                            <button className="btn btn-outline btn-sm btn-icon" title="แก้ไข" onClick={()=>setModal({type:'edit',mat:m})}>✏</button>
                            <button className="btn btn-warning btn-sm btn-icon" title="ปรับสต็อค" onClick={()=>setModal({type:'adjust',mat:m})}>⚙</button>
                            <button className="btn btn-danger btn-sm btn-icon" title="ลบ" onClick={()=>handleDelete(m.id,m.part_no)}>🗑</button>
                          </div>
                        </td>
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
            {Array.from({length:Math.min(pages,5)},(_,i)=>i+1).map(p=>(
              <button key={p} className={`pg-btn${p===page?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
            ))}
            {pages>5&&<span style={{padding:'0 4px',color:'var(--text-muted)'}}>…</span>}
            {pages>5&&<button className={`pg-btn${page===pages?' active':''}`} onClick={()=>setPage(pages)}>{pages}</button>}
            <button className="pg-btn" disabled={page===pages||pages===0} onClick={()=>setPage(p=>p+1)}>›</button>
          </div>
        </div>
      </div>

      {modal?.type === 'add'    && <MaterialModal filters={filterOpts} onSave={handleSave} onClose={()=>setModal(null)} />}
      {modal?.type === 'edit'   && <MaterialModal initial={modal.mat} filters={filterOpts} onSave={handleSave} onClose={()=>setModal(null)} />}
      {modal?.type === 'adjust' && <AdjustModal mat={modal.mat} onSave={handleAdjust} onClose={()=>setModal(null)} />}
      {modal?.type === 'detail' && <DetailModal id={modal.mat.id} onClose={()=>setModal(null)} />}
    </>
  )
}
