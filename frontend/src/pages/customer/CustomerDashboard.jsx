import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCustomerShipments } from '../../hooks/useCustomerShipments'
import { activeStatuses } from '../../utils/customerShipments'
import { ShipmentList, ShipmentLoading } from '../../components/common/ShipmentComponents'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
export default function CustomerDashboard() {
  const { user } = useAuth()
  const { data, loading, error, refresh } = useCustomerShipments()
  const shipments = data?.shipments || []
  const active = shipments.filter(item => activeStatuses.includes(item.status)).slice(0, 3)

  return (
    <div className="page-stack">
      <header className="customer-header">
        <div>
          <p className="eyebrow">YOUR DELIVERY OVERVIEW</p>
          <h1>Hello, {user?.name || 'there'}.</h1>
          <p className="page-description">From your next pickup to the final handover.</p>
        </div>
        <div className="customer-actions">
          <Link className="button button-primary" to="/customer/book">
            Book shipment
          </Link>
          <Link className="button button-quiet" to="/customer/shipments">
            View my shipments
          </Link>
        </div>
      </header>

      {loading ? (
        <ShipmentLoading />
      ) : error ? (
        <ErrorState title="Could not load shipments" message={error} onRetry={refresh} />
      ) : (
        <>
          <section>
            <div className="section-heading">
              <h2>On the move</h2>
              <span>Active shipments</span>
            </div>
            {active.length ? (
              <ShipmentList shipments={active} />
            ) : (
              <EmptyState title="No active shipments" message="Your next delivery starts with a booking." />
            )}
          </section>

          <section>
            <div className="section-heading">
              <h2>Recent shipments</h2>
              <Link className="text-action" to="/customer/shipments">
                View all shipments →
              </Link>
            </div>
            <ShipmentList shipments={shipments.slice(0, 5)} />
          </section>
        </>
      )}
    </div>
  )
}
