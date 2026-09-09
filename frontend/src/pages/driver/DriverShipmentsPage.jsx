import { useState } from 'react'
import { useDriverData } from '../../hooks/useDriverData'
import { DriverShipmentList } from '../../components/driver/DriverComponents'
import { ShipmentLoading } from '../../components/common/ShipmentComponents'
import ErrorState from '../../components/common/ErrorState'
import Button from '../../components/ui/Button'
import { formatStatus } from '../../utils/formatters'
export default function DriverShipmentsPage() {
  const [status, setStatus] = useState('')
  const [feedback, setFeedback] = useState('')
  const state = useDriverData('shipments', status)

  return (
    <div className="page-stack">
      <header className="customer-header">
        <div>
          <p className="eyebrow">YOUR DELIVERY QUEUE</p>
          <h1>Assigned shipments</h1>
          <p className="page-description">One clear next step for every delivery.</p>
        </div>
        <Button variant="quiet" disabled={state.loading} onClick={state.refresh}>
          Refresh shipments
        </Button>
      </header>

      <div className="status-filter">
        <label htmlFor="driver-status">Shipment status</label>
        <select
          id="driver-status"
          value={status}
          onChange={event => {
            setStatus(event.target.value)
            setFeedback('')
          }}
        >
          <option value="">All shipments</option>
          {['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'].map(value => (
            <option key={value} value={value}>
              {formatStatus(value)}
            </option>
          ))}
        </select>
      </div>

      {feedback && (
        <p className="booking-success" role="status" style={{ marginBottom: '1rem' }}>
          {feedback}
        </p>
      )}

      {state.loading ? (
        <ShipmentLoading />
      ) : state.error ? (
        <ErrorState
          title="Could not load assigned shipments"
          message={state.error}
          onRetry={state.refresh}
        />
      ) : (
        <DriverShipmentList
          shipments={state.data.shipments || []}
          onRefresh={state.refresh}
          onFeedback={setFeedback}
          filtered={Boolean(status)}
        />
      )}
    </div>
  )
}
