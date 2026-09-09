import { Link } from 'react-router-dom'
export default function RegisterPage() {
  return <section className="auth-card">
    <p className="eyebrow">A BETTER WAY TO DELIVER</p><h1>Your next<br />chapter starts here.</h1>
    <p className="page-description">Book with confidence or join the people making every delivery happen.</p>
    <div className="auth-preview"><span className="preview-label">CREATE AN ACCOUNT</span><h2>Registration is being prepared.</h2>
      <p>Customer and driver account setup will be available here. Operations access is managed by your organization.</p>
    </div>
    <div className="auth-switch">Already have an account? <Link to="/login">Back to sign in <span aria-hidden="true">→</span></Link></div>
  </section>
}
