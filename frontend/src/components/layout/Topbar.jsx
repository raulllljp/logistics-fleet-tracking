import Button from '../ui/Button'
export default function Topbar({ user, onLogout, menuOpen, onToggleMenu }) {
  return <header className="topbar">
    <Button variant="quiet" className="menu-toggle" aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={onToggleMenu}>
      {menuOpen ? 'Close menu' : 'Menu'}
    </Button>
    <span className="topbar-title">Delivery workspace</span>
    <div className="account-controls">
      <div className="account-copy"><span>{user.name}</span><small>{user.role}</small></div>
      <Button variant="quiet" onClick={onLogout}>Sign out</Button>
    </div>
  </header>
}
