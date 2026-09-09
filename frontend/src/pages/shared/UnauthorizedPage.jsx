import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardPath } from '../../utils/constants'
export default function UnauthorizedPage() {
  const { user } = useAuth()
  const destination = user && getDashboardPath(user.role) !== '/unauthorized' ? getDashboardPath(user.role) : '/login'
  return <main className="standalone-page" tabIndex={-1}><section className="access-card"><p className="eyebrow">ACCESS RESTRICTED</p><h1>A different workspace.</h1><p>Your current account doesn’t have access to this page. Head back to your workspace to continue with the tools available to you.</p><Link className="button button-primary" to={destination}>{user ? 'Back to my dashboard' : 'Back to sign in'}</Link></section></main>
}
