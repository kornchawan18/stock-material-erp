import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMaterials } from '../api/api'
import { useAlert } from '../App'

export default function Alerts() {
  const navigate = useNavigate()
  const { refresh } = useAlert()
  const [low, setLow] = useState([])
  const [zero, setZero] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMaterials({ stock: 'low', limit: 9999 }),
      getMaterials({ stock: 'zero', limit: 9999 }),
    ]).then(([r1, r2]) => {
      setLow(r1.data.data); setZero(r2.data.data)
    }).finally(() => setLoading(false))
    refresh()
  }, [refresh])

  if (loading) return <div className="loading"><div className="spinner"/>กำลังโหลด...</div>

  const noAlerts = low.length === 0 && zero.length === 0

  return (
    <>
      <div className="page-header"><div><div className="page-title">⚠ แจ้งเตือน</div><div className="page-subtitle">รายการวัสดุที่ต้องดำเนินการ</div></div></div>

      {noAlerts ? (
        <div className="card"><div className="card-body"><div className="empty-state"><div className="empty-icon">✅</div><p style={{color:'var(--success)',fontWeight:700,fontSize:'1rem'}}>ไม่มีรายการแจ้งเตือน ทุกอย่างปกติ!</p></div></div></div>
      ) : (
        <>
          {zero.length > 0 && (
            <div className="card" style={{marginBottom:16}}>
              <div className="card-header" style={{borderLeft:'4px solid var(--danger)'}}>
                <span className="card-title" style={{color:'var(--danger)'}}>✗ หมดสต็อค ({zero.length} รายการ)</span>
                <button className="btn btn-success btn-sm" onClick={()=>navigate('/receive')}>⬆ ไปรับเข้า</button>
              </div>
              <div className="table-wrap">
                <table><thead><tr><th>Part No.</th><th>Category</th><th>Group</th><th>Description</th><th>Location</th></tr></thead>
                  <tbody>{zero.map(m=>(
                    <tr key={m.id}>
                      <td className="mono">{m.part_no}</td>
                      <td><span className={`chip chip-${m.category}`}>{m.category}</span></td>
                      <td>{m.grp}</td>
                      <td className="desc-cell" title={m.description}>{m.description}</td>
                      <td>{m.location||'-'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {low.length > 0 && (
            <div className="card">
              <div className="card-header" style={{borderLeft:'4px solid var(--warning)'}}>
                <span className="card-title" style={{color:'var(--warning)'}}>⚠ ต่ำกว่า Min Stock ({low.length} รายการ)</span>
                <button className="btn btn-success btn-sm" onClick={()=>navigate('/receive')}>⬆ ไปรับเข้า</button>
              </div>
              <div className="table-wrap">
                <table><thead><tr><th>Part No.</th><th>Category</th><th>Description</th><th style={{textAlign:'center'}}>Qty</th><th style={{textAlign:'center'}}>Min Stock</th><th style={{textAlign:'center'}}>ขาด</th></tr></thead>
                  <tbody>{low.map(m=>(
                    <tr key={m.id}>
                      <td className="mono">{m.part_no}</td>
                      <td><span className={`chip chip-${m.category}`}>{m.category}</span></td>
                      <td className="desc-cell" title={m.description}>{m.description}</td>
                      <td style={{textAlign:'center',fontWeight:700,color:'var(--warning)'}}>{m.qty}</td>
                      <td style={{textAlign:'center'}}>{m.min_stock}</td>
                      <td style={{textAlign:'center',fontWeight:700,color:'var(--danger)'}}>{m.min_stock-m.qty}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
