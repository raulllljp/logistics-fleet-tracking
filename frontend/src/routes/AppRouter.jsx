import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getDashboardPath } from '../utils/constants'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import PublicLayout from '../layouts/PublicLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import NotFoundPage from '../pages/shared/NotFoundPage'
import UnauthorizedPage from '../pages/shared/UnauthorizedPage'
import LoadingScreen from '../components/common/LoadingScreen'
import ErrorState from '../components/common/ErrorState'
import Button from '../components/ui/Button'
import CustomerDashboard from '../pages/customer/CustomerDashboard'
import BookShipmentPage from '../pages/customer/BookShipmentPage'
import CustomerShipmentsPage from '../pages/customer/CustomerShipmentsPage'
import ShipmentDetailPage from '../pages/customer/ShipmentDetailPage'
import DriverDashboard from '../pages/driver/DriverDashboard'
import DriverShipmentsPage from '../pages/driver/DriverShipmentsPage'
import DriverTripsPage from '../pages/driver/DriverTripsPage'
import OperationsDashboard from '../pages/operations/OperationsDashboard'
import OperationsShipmentsPage from '../pages/operations/OperationsShipmentsPage'
import DriversPage from '../pages/operations/DriversPage'
import VehiclesPage from '../pages/operations/VehiclesPage'
import TripsPage from '../pages/operations/TripsPage'
import ReportsPage from '../pages/operations/ReportsPage'
function PublicOnly() {
  const { isLoading, isAuthenticated, user, token, error, refreshCurrentUser, logout } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (error && token) return <ErrorState title="We couldn’t verify your session" message={error} onRetry={refreshCurrentUser}><Button variant="quiet" onClick={logout}>Return to sign in</Button></ErrorState>
  return isAuthenticated ? <Navigate to={getDashboardPath(user.role)} replace /> : <Outlet />
}
function HomeRedirect() {
  const { isLoading, isAuthenticated, user } = useAuth()
  if (isLoading) return <LoadingScreen />
  return <Navigate to={isAuthenticated ? getDashboardPath(user.role) : '/login'} replace />
}
function RouteFocus() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = (document.querySelector('h1')?.textContent || 'Workspace') + ' | Fleetline'
    document.querySelector('main')?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
export function AppRoutes() {
  return <><RouteFocus /><Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route element={<PublicOnly />}><Route element={<PublicLayout />}>
      <Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} />
    </Route></Route>
    <Route element={<ProtectedRoute />}><Route element={<DashboardLayout />}>
      <Route element={<RoleRoute allowedRoles={["customer"]} />}>
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/book" element={<BookShipmentPage />} />
        <Route path="/customer/shipments" element={<CustomerShipmentsPage />} />
        <Route path="/customer/shipments/:id" element={<ShipmentDetailPage />} />
      </Route>
      <Route element={<RoleRoute allowedRoles={["driver"]} />}>
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/driver/shipments" element={<DriverShipmentsPage />} />
        <Route path="/driver/trips" element={<DriverTripsPage />} />
      </Route>
      <Route element={<RoleRoute allowedRoles={["dispatcher","admin"]} />}>
        <Route path="/operations/dashboard" element={<OperationsDashboard />} />
        <Route path="/operations/shipments" element={<OperationsShipmentsPage />} />
        <Route path="/operations/drivers" element={<DriversPage />} />
        <Route path="/operations/vehicles" element={<VehiclesPage />} />
        <Route path="/operations/trips" element={<TripsPage />} />
        <Route path="/operations/reports" element={<ReportsPage />} />
      </Route>
    </Route></Route>
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></>
}
export default function AppRouter() { return <BrowserRouter><AppRoutes /></BrowserRouter> }
