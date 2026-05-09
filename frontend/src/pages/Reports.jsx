import { useState } from 'react'
import { getMaterials, getTransactions } from '../api/api'

export default function Reports() {
  const [active, setActive] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  async function loadReport(type) {
    setActive(type); setLoading(true)
    try {
      if (type === 'summary') {
        const [pip,str,ins,all] = await Promise.all([
          getMaterials({category:'PIP',limit:9999}), getMaterials({category:'STR',limit:9999}),
          getMaterials({category:'INS',limit:9999}), getMaterials({limit:9999}),
        ])
        const sumQty = arr => arr.reduce((s,m) => s + m.qty, 0)
        setData({ pip: pip.data, str: str.data, ins: ins.data, all: all.data })
      } else if (type === 'movement') {
        const r = await getTransactions({ limit: 9999 })
        setData(r.data)
      } else if (type === 'lowstock') {
        const [low, zero] = await Promise.all([getMaterials({stock:'low',limit:9999}), getMaterials({stock:'zero',limit:9999})])
        setData({ low: low.data, zero: zero.data })
      }
    } finally { setLoading(false) }
  }

  const CARDS = [
    { type: 'summary',  icon: '📊', title: 'Stock Summary Report',    sub: 'สรุปยอดคงเหลือตาม Category/Group', cls: 'blue' },
    { type: 'movement', icon: '📋', title: 'Movement Report',         sub: 'รายงานการเคลื่อนไหวสต็อค',       cls: 'green' },
    { type: 'lowstock', icon: '⚠',  title: 'Low Stock Alert Report',  sub: 'รายการวัสดุที่ต้องสั่งเพิ่ม',    cls: 'red' },
  ]

  return (
    <>
      <div className="page-header"><div><div className="page-title">รายงาน</div><div className="page-subtitle">วิเคราะห์ข้อมูลสต็อควัสดุ</div></div></div>

      <div className="report-cards">
        {CARDS.map(c => (
          <div key={c.type} className={`report-card${active===c.type?' card':''}`} style={active===c.type?{borderColor:'var(--primary-light)',boxShadow:'0 4px 12px rgba(59,130,246,0.12)'}:{}} onClick={()=>loadReport(c.type)}>
            <div className={`kpi-icon ${c.cls}`} style={{width:48,height:48,fontSize:'1.4rem',flexShrink:0}}>{c.icon}</div>
            <div><div style={{fontWeight:700}}>{c.title}</div><div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:2}}>{c.sub}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        {loading && <div className="loading"><div className="spinner"/>กำลังโหลดรายงาน...</div>}

        {!loading && active === 'summary' && data && (
          <>
            <div className="card-header"><span className="card-title">Stock Summary Report</span></div>
            <div className="card-body">
              <div className="section-title">สรุปตาม Category</div>
              <div className="table-wrap" style={{marginBottom:24}}>
                <table><thead><tr><th>Category</th><th>จำนวนรายการ</th><th>Total Qty</th><th>มีสต็อค</th><th>หมดสต็อค</th></tr></thead>
                  <tbody>
                    {[{label:'PIP',d:data.pip},{label:'STR',d:data.str},{label:'INS',d:data.ins}].map(({label,d})=>(
                      <tr key={label}>
                        <td><span className={`chip chip-${label}`}>{label}</span></td>
                        <td>{d.total}</td>
                        <td style={{fontWeight:700}}>{d.data.reduce((s,m)=>s+m.qty,0).toLocaleString()}</td>
                        <td style={{color:'var(--success)',fontWeight:700}}>{d.data.filter(m=>m.qty>0).length}</td>
                        <td style={{color:'var(--danger)',fontWeight:700}}>{d.data.filter(m=>m.qty===0).length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!loading && active === 'movement' && data && (
          <>
            <div className="card-header"><span className="card-title">Movement Report — {data.total?.toLocaleString()} รายการ</span></div>
            <div className="card-body">
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
                {[['รับเข้า (IN)','IN','green'],['เบิกออก (OUT)','OUT','red'],['ปรับปรุง (ADJ)','ADJ','purple']].map(([lbl,type,cls])=>(
                  <div key={type} className="kpi-card">
                    <div className="kpi-header"><span className="kpi-label">{lbl}</span><div className={`kpi-icon ${cls}`}>{type==='IN'?'⬆':type==='OUT'?'⬇':'⚙'}</div></div>
                    <div className="kpi-value">{data.data.filter(t=>t.type===type).reduce((s,t)=>s+t.qty,0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="table-wrap">
                <table><thead><tr><th>วันที่</th><th>Doc No.</th><th>ประเภท</th><th>Part No.</th><th>Qty</th><th>หน่วยงาน</th></tr></thead>
                  <tbody>{data.data.slice(0,100).map(t=>(
                    <tr key={t.id}><td>{t.date}</td><td className="mono">{t.doc_no}</td><td><span className={`chip chip-${t.type}`}>{t.type}</span></td><td className="mono">{t.part_no}</td><td style={{fontWeight:700,color:t.type==='IN'?'var(--success)':'var(--danger)'}}>{t.type==='IN'?'+':'-'}{t.qty}</td><td>{t.dept||'-'}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!loading && active === 'lowstock' && data && (
          <>
            <div className="card-header"><span className="card-title">Low Stock Alert Report</span></div>
            <div className="card-body">
              <div className="warn-box">⚠ พบ {data.low.total} รายการ ต่ำกว่า Min Stock และ {data.zero.total} รายการ หมดสต็อค</div>
              <div className="section-title">รายการต่ำกว่า Min Stock</div>
              <div className="table-wrap" style={{marginBottom:20}}>
                <table><thead><tr><th>Part No.</th><th>Description</th><th>Qty</th><th>Min Stock</th><th>ขาด</th></tr></thead>
                  <tbody>{data.low.data.length===0
                    ? <tr><td colSpan="5" style={{textAlign:'center',padding:20,color:'var(--text-muted)'}}>ไม่พบรายการ</td></tr>
                    : data.low.data.map(m=><tr key={m.id}><td className="mono">{m.part_no}</td><td className="desc-cell">{m.description}</td><td style={{color:'var(--warning)',fontWeight:700}}>{m.qty}</td><td>{m.min_stock}</td><td style={{color:'var(--danger)',fontWeight:700}}>{m.min_stock-m.qty}</td></tr>)
                  }</tbody>
                </table>
              </div>
              <div className="section-title">รายการหมดสต็อค</div>
              <div className="table-wrap">
                <table><thead><tr><th>Part No.</th><th>Cat</th><th>Description</th></tr></thead>
                  <tbody>{data.zero.data.length===0
                    ? <tr><td colSpan="3" style={{textAlign:'center',padding:20,color:'var(--text-muted)'}}>ไม่พบรายการ</td></tr>
                    : data.zero.data.map(m=><tr key={m.id}><td className="mono">{m.part_no}</td><td><span className={`chip chip-${m.category}`}>{m.category}</span></td><td className="desc-cell">{m.description}</td></tr>)
                  }</tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!loading && !active && (
          <div className="card-body"><div className="empty-state"><div className="empty-icon">📈</div><p>เลือกรายงานด้านบน</p></div></div>
        )}
      </div>
    </>
  )
}
