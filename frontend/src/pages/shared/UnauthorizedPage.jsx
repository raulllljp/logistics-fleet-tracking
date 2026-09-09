import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardPath } from '../../utils/constants'
export default function UnauthorizedPage() {
  const { user } = useAuth()
  const destination = user && getDashboardPath(user.role) !== '/unauthorized' ? getDashboardPath(user.role) : '/login'
  return <section className="standalone-page"><p className="eyebrow">ACCESS RESTRICTED</p><h1>A different workspace.</h1><p>Your account doesn’t have access to this page.</p><Link className="button button-primary" to={destination}>Return to your workspace</Link></section>
}
