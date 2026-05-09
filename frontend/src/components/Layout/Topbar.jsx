import { useNavigate } from 'react-router-dom'

export default function Topbar() {
  const navigate = useNavigate()

  function handleSearch(e) {
    if (e.key === 'Enter' && e.target.value.trim()) {
      navigate(`/materials?search=${encodeURIComponent(e.target.value.trim())}`)
      e.target.value = ''
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-logo">
        <div className="logo-icon">M</div>
        <div>
          <div className="logo-text">MatERP</div>
          <div className="logo-sub">Material Management</div>
        </div>
      </div>
      <div className="topbar-search">
        <span>🔍</span>
        <input placeholder="ค้นหา Part No., วัสดุ... (กด Enter)" onKeyDown={handleSearch} />
      </div>
      <div className="topbar-right">
        <div className="user-chip">
          <div className="user-avatar">AD</div>
          <span className="user-name">Admin</span>
        </div>
      </div>
    </header>
  )
}
