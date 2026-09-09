import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingScreen from '../components/common/LoadingScreen'
import ErrorState from '../components/common/ErrorState'
import Button from '../components/ui/Button'
export default function ProtectedRoute({ children }) {
  const auth = useAuth()
  const location = useLocation()
  if (auth.isLoading) return <LoadingScreen />
  if (auth.error && auth.token) return <ErrorState title="We couldn’t verify your session" message={auth.error} onRetry={auth.refreshCurrentUser}><Button variant="quiet" onClick={auth.logout}>Return to sign in</Button></ErrorState>
  if (!auth.isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children || <Outlet />
}
