import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import Sidebar from './components/Layout/Sidebar'
import Topbar from './components/Layout/Topbar'
import Dashboard from './pages/Dashboard'
import Materials from './pages/Materials'
import StockBalance from './pages/StockBalance'
import Receive from './pages/Receive'
import Issue from './pages/Issue'
import TxLog from './pages/TxLog'
import Reports from './pages/Reports'
import Alerts from './pages/Alerts'

// Toast context
const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

// Alert badge context
const AlertCtx = createContext({ count: 0, refresh: () => {} })
export const useAlert = () => useContext(AlertCtx)

export default function App() {
  const [toasts, setToasts] = useState([])
  const [alertCount, setAlertCount] = useState(0)

  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const refreshAlerts = useCallback(async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '/api') + '/materials?stock=low&limit=1')
      const res2 = await fetch((import.meta.env.VITE_API_URL || '/api') + '/materials?stock=zero&limit=1')
      const d1 = await res.json(); const d2 = await res2.json()
      setAlertCount((d1.total || 0) + (d2.total || 0))
    } catch {}
  }, [])

  useEffect(() => { refreshAlerts() }, [refreshAlerts])

  return (
    <ToastCtx.Provider value={toast}>
      <AlertCtx.Provider value={{ count: alertCount, refresh: refreshAlerts }}>
        <div className="layout">
          <Topbar />
          <Sidebar alertCount={alertCount} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/materials"  element={<Materials />} />
              <Route path="/stock"      element={<StockBalance />} />
              <Route path="/receive"    element={<Receive />} />
              <Route path="/issue"      element={<Issue />} />
              <Route path="/txlog"      element={<TxLog />} />
              <Route path="/reports"    element={<Reports />} />
              <Route path="/alerts"     element={<Alerts />} />
            </Routes>
          </main>
        </div>
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'ℹ'} {t.msg}
            </div>
          ))}
        </div>
      </AlertCtx.Provider>
    </ToastCtx.Provider>
  )
}
