import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCustomerShipments } from '../../hooks/useCustomerShipments'
import { SHIPMENT_STATUSES } from '../../utils/constants'
import { formatStatus } from '../../utils/formatters'
import { ShipmentList, ShipmentLoading } from '../../components/common/ShipmentComponents'
import ErrorState from '../../components/common/ErrorState'
export default function CustomerShipmentsPage() {
  const { state } = useLocation()
  const [status, setStatus] = useState('')
  const { data, loading, error, refresh } = useCustomerShipments({ status })

  return (
    <div className="page-stack">
      <header className="customer-header">
        <div>
          <p className="eyebrow">YOUR DELIVERIES</p>
          <h1>My shipments</h1>
          <p className="page-description">Every booking, from pickup to arrival.</p>
        </div>
        <Link className="button button-primary" to="/customer/book">
          Book shipment
        </Link>
      </header>

      {state?.booked && (
        <div className="booking-success" role="status">
          Shipment booked successfully. Tracking has started.
        </div>
      )}

      <div className="status-filter">
        <label htmlFor="shipment-status">Filter by status</label>
        <select
          id="shipment-status"
          value={status}
          onChange={event => setStatus(event.target.value)}
        >
          <option value="">All shipments</option>
          {SHIPMENT_STATUSES.map(value => (
            <option key={value} value={value}>
              {formatStatus(value)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <ShipmentLoading />
      ) : error ? (
        <ErrorState title="Could not load shipments" message={error} onRetry={refresh} />
      ) : (
        <ShipmentList shipments={data?.shipments || []} filtered={Boolean(status)} />
      )}
    </div>
  )
}
