import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDashboardPath } from '../utils/constants'
import { navigationForRole } from '../routes/navigation'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  return <div className="dashboard-layout" onKeyDown={(event) => { if (event.key === 'Escape') setMenuOpen(false) }}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Sidebar items={navigationForRole(user.role)} dashboardPath={getDashboardPath(user.role)} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
    <div className="dashboard-body">
      <Topbar user={user} onLogout={logout} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen(!menuOpen)} />
      <main id="main-content" tabIndex={-1}><Outlet /></main>
      <footer className="dashboard-footer">Fleetline / Logistics & delivery</footer>
    </div>
  </div>
}
