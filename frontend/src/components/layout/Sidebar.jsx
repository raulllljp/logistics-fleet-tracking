import { NavLink } from 'react-router-dom'
import Brand from './Brand'
export default function Sidebar({ items, dashboardPath, open, onNavigate }) {
  return <aside id="workspace-navigation" className={'sidebar ' + (open ? 'sidebar-open' : '')}>
    <Brand to={dashboardPath} inverse />
    <p className="nav-label">WORKSPACE</p>
    <nav aria-label="Workspace navigation">
      {items.map(({ to, label }, index) => <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => 'nav-item' + (isActive ? ' nav-active' : '')}>
        <span className="nav-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{label}
      </NavLink>)}
    </nav>
    <div className="sidebar-foot"><span className="sidebar-line" /><p>A clearer way<br />to keep things moving.</p></div>
  </aside>
}
