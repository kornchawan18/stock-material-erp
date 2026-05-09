import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { getDashboard } from '../api/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

export default function Dashboard() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getDashboard().then(r => setData(r.data)).catch(() => {})
  }, [])

  if (!data) return <div className="loading"><div className="spinner" /> กำลังโหลด...</div>

  const KPIs = [
    { label: 'รายการวัสดุทั้งหมด', value: data.totalMat?.toLocaleString(), sub: 'Part Numbers', icon: '📦', cls: 'blue' },
    { label: 'Total Qty On Hand',  value: data.totalQty?.toLocaleString(), sub: 'จำนวนรวมในคลัง',  icon: '📊', cls: 'green' },
    { label: 'มีสต็อค',            value: data.inStock?.toLocaleString(),  sub: 'รายการ (qty > 0)', icon: '✓',  cls: 'green' },
    { label: 'ต่ำกว่า Min Stock',  value: data.lowStock?.toLocaleString(), sub: 'ต้องสั่งเพิ่ม',   icon: '⚠',  cls: 'orange' },
    { label: 'หมดสต็อค',          value: data.outStock?.toLocaleString(), sub: 'qty = 0',          icon: '✗',  cls: 'red' },
    { label: 'Transaction วันนี้', value: data.todayTx?.toLocaleString(),  sub: 'รายการเคลื่อนไหว', icon: '📄', cls: 'purple' },
  ]

  const movLabels = (data.movement || []).map(m => {
    const d = new Date(m.date)
    return d.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
  })

  const barData = {
    labels: movLabels,
    datasets: [
      { label: 'รับเข้า', data: data.movement?.map(m => m.in),  backgroundColor: '#059669', borderRadius: 4 },
      { label: 'เบิกออก', data: data.movement?.map(m => m.out), backgroundColor: '#dc2626', borderRadius: 4 },
    ]
  }

  const catMap = {}
  ;(data.catStats || []).forEach(c => { catMap[c.category] = c.count })
  const donutData = {
    labels: ['PIP', 'STR', 'INS'],
    datasets: [{ data: ['PIP','STR','INS'].map(c => catMap[c]||0), backgroundColor: ['#3b82f6','#10b981','#f59e0b'], borderWidth: 2 }]
  }

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } } }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</div>
        </div>
      </div>

      <div className="kpi-grid">
        {KPIs.map(k => (
          <div className="kpi-card" key={k.label}>
            <div className="kpi-header">
              <span className="kpi-label">{k.label}</span>
              <div className={`kpi-icon ${k.cls}`}>{k.icon}</div>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Stock Movement (14 วันล่าสุด)</span></div>
          <div className="card-body"><div className="chart-wrap"><Bar data={barData} options={chartOpts} /></div></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">แยกตาม Category</span></div>
          <div className="card-body">
            <div className="chart-wrap">
              <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header"><span className="card-title">Top 10 Stock สูงสุด</span></div>
          <div className="card-body">
            {data.topStock?.length === 0
              ? <div className="empty-state"><div className="empty-icon">📦</div><p>ยังไม่มีข้อมูล Stock</p></div>
              : data.topStock?.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="mono" style={{ color: 'var(--primary)', width: 120, flexShrink: 0, fontSize: '0.78rem' }}>{m.part_no}</span>
                  <span style={{ flex: 1, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.description}</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)', flexShrink: 0 }}>{m.qty?.toLocaleString()}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Transaction ล่าสุด</span>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/txlog')}>ดูทั้งหมด</button>
          </div>
          <div className="card-body">
            {data.recentTx?.length === 0
              ? <div className="empty-state"><div className="empty-icon">📄</div><p>ยังไม่มี Transaction</p></div>
              : data.recentTx?.map(t => (
                <div key={t.id} className="tx-row">
                  <div className={`tx-icon ${t.type}`}>{t.type === 'IN' ? '⬆' : t.type === 'OUT' ? '⬇' : '⚙'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t.part_no}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.doc_no} · {t.date}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: t.type === 'IN' ? 'var(--success)' : 'var(--danger)' }}>
                    {t.type === 'IN' ? '+' : '-'}{t.qty}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </>
  )
}
