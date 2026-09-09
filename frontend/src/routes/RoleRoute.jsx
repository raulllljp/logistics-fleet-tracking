import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
export default function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth()
  return allowedRoles.includes(user?.role) ? children || <Outlet /> : <Navigate to="/unauthorized" replace />
}
