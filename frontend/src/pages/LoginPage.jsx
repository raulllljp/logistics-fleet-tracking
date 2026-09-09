import { Link } from 'react-router-dom'
export default function LoginPage() {
  return <section className="auth-card">
    <p className="eyebrow">YOUR DELIVERY WORKSPACE</p><h1>Welcome back.</h1>
    <p className="page-description">A single place to manage deliveries, coordinate your fleet, and follow every shipment.</p>
    <div className="auth-preview"><span className="preview-label">SIGN IN</span><h2>Account access is on its way.</h2>
      <p>The sign-in screen is being prepared. You’ll be able to access your workspace here when it’s ready.</p>
    </div>
    <div className="auth-switch">New to Fleetline? <Link to="/register">Explore account setup <span aria-hidden="true">→</span></Link></div>
    <p className="auth-note">For customers, drivers, and operations teams.</p>
  </section>
}
