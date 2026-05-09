import { NavLink } from 'react-router-dom'

const NAV = [
  { section: 'Main' },
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { section: 'Inventory' },
  { to: '/materials',  icon: '📦', label: 'Master Material' },
  { to: '/stock',      icon: '📋', label: 'Stock Balance' },
  { section: 'Transaction' },
  { to: '/receive',    icon: '⬆', label: 'รับเข้า (GR)' },
  { to: '/issue',      icon: '⬇', label: 'เบิกออก (GI)' },
  { to: '/txlog',      icon: '📄', label: 'ประวัติ Tx' },
  { section: 'Reports' },
  { to: '/reports',    icon: '📈', label: 'รายงาน' },
  { to: '/alerts',     icon: '⚠', label: 'แจ้งเตือน', badge: true },
]

export default function Sidebar({ alertCount }) {
  return (
    <nav className="sidebar">
      {NAV.map((item, i) =>
        item.section ? (
          <div key={i} className="nav-section">{item.section}</div>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && alertCount > 0 && (
              <span className="nav-badge">{alertCount}</span>
            )}
          </NavLink>
        )
      )}
    </nav>
  )
}
