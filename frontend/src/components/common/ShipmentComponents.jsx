import { Link } from 'react-router-dom'
import StatusBadge from '../ui/StatusBadge'
import EmptyState from './EmptyState'
import {
  formatCurrency,
  formatDateTime,
  formatStatus,
  formatShipmentId,
} from '../../utils/formatters'

export function RouteVisual({ pickup, destination, className = '' }) {
  return (
    <div className={`shipment-route ${className}`.trim()}>
      <div className="route-endpoint">
        <small>Pickup</small>
        <p title={pickup}>{pickup || '—'}</p>
      </div>
      <span className="route-connector" aria-hidden="true">
        <span className="route-connector-dot" />
        <i />
        <span className="route-connector-dot" />
      </span>
      <div className="route-endpoint">
        <small>Destination</small>
        <p title={destination}>{destination || '—'}</p>
      </div>
    </div>
  )
}

export function ShipmentCard({ shipment }) {
  return (
    <article className="shipment-card">
      <header>
        <span className="shipment-reference">{formatShipmentId(shipment._id)}</span>
        <StatusBadge status={shipment.status} />
      </header>
      <RouteVisual pickup={shipment.pickupAddress} destination={shipment.dropAddress} />
      <dl className="shipment-facts">
        <div>
          <dt>Weight</dt>
          <dd>{shipment.weight ?? '—'} kg</dd>
        </div>
        <div>
          <dt>Estimated cost</dt>
          <dd>{formatCurrency(shipment.estimatedCost)}</dd>
        </div>
        <div>
          <dt>Booked</dt>
          <dd>{formatDateTime(shipment.bookedAt)}</dd>
        </div>
      </dl>
      <Link
        className="text-action"
        to={'/customer/shipments/' + encodeURIComponent(shipment._id)}
        aria-label={'View details for shipment ' + shipment._id}
      >
        View details <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}

export function ShipmentList({ shipments, filtered = false }) {
  return shipments.length ? (
    <div className="shipment-grid">
      {shipments.map(shipment => (
        <ShipmentCard key={shipment._id} shipment={shipment} />
      ))}
    </div>
  ) : (
    <EmptyState
      title={filtered ? 'No shipments with this status' : 'No shipments yet'}
      message={
        filtered
          ? 'Choose another status to see more deliveries.'
          : 'Book your first shipment to start tracking deliveries.'
      }
    >
      {!filtered && (
        <Link className="button button-primary" to="/customer/book">
          Book shipment
        </Link>
      )}
    </EmptyState>
  )
}

const CANONICAL_STEPS = ['BOOKED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED']

function buildTimelineSteps(history = [], currentStatus = 'BOOKED') {
  const sortedHistory = [...(history || [])].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  )

  if (currentStatus === 'FAILED') {
    return sortedHistory.map((event, index) => {
      const isFailed = event.status === 'FAILED' || index === sortedHistory.length - 1
      return {
        key: `${event.status}-${index}`,
        status: event.status,
        label: formatStatus(event.status),
        state: isFailed ? 'failed' : 'completed',
        timestamp: event.timestamp,
        location: event.location,
        note: event.note,
      }
    })
  }

  const currentIndex = CANONICAL_STEPS.indexOf(currentStatus)
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0

  return CANONICAL_STEPS.map((step, idx) => {
    const matchedEvent = sortedHistory.filter(e => e.status === step).pop()
    let state = 'future'
    if (idx < effectiveIndex) {
      state = 'completed'
    } else if (idx === effectiveIndex) {
      state = 'current'
    }
    return {
      key: step,
      status: step,
      label: formatStatus(step),
      state,
      timestamp: matchedEvent?.timestamp,
      location: matchedEvent?.location,
      note: matchedEvent?.note,
    }
  })
}

export function ShipmentTimeline({ history = [], status = 'BOOKED' }) {
  const steps = buildTimelineSteps(history, status)

  return (
    <section className="customer-panel tracking-journey-panel">
      <div className="section-heading">
        <h2>Tracking timeline</h2>
        <StatusBadge status={status} />
      </div>
      {status === 'FAILED' && (
        <p className="field-error timeline-alert" role="alert">
          Delivery failed. The recorded updates are shown below.
        </p>
      )}
      <ol className="shipment-timeline" aria-label="Shipment tracking timeline">
        {steps.map(step => {
          const isCurrent = step.state === 'current'
          const isCompleted = step.state === 'completed'
          const isFailed = step.state === 'failed'
          const isFuture = step.state === 'future'

          let markerClass = 'timeline-marker-future'
          if (isFailed) markerClass = 'timeline-marker-failed'
          else if (isCurrent) markerClass = 'timeline-marker-current'
          else if (isCompleted) markerClass = 'timeline-marker-completed'

          return (
            <li
              key={step.key}
              className={`timeline-step timeline-step-${step.state}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className={`timeline-dot ${markerClass}`} aria-hidden="true" />
              <div className="timeline-content">
                <div className="timeline-header">
                  <strong className={`timeline-title ${isFuture ? 'text-muted' : ''}`}>
                    {step.label}
                  </strong>
                  {isCurrent && <span className="timeline-badge-active">In progress</span>}
                </div>
                {step.timestamp && (
                  <p className="timeline-time">{formatDateTime(step.timestamp)}</p>
                )}
                {step.location && (
                  <p className="timeline-detail-text">
                    <span className="timeline-detail-label">Location:</span> {step.location}
                  </p>
                )}
                {step.note && (
                  <p className="timeline-detail-text">
                    <span className="timeline-detail-label">Note:</span> {step.note}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function DeliveryProofCard({ proof }) {
  return (
    <section className="customer-panel proof-panel">
      <p className="eyebrow">DELIVERY CONFIRMATION</p>
      <h2>Delivery proof</h2>
      {proof ? (
        <dl className="proof-facts">
          <div>
            <dt>Delivered to</dt>
            <dd>{proof.receiverName || '—'}</dd>
          </div>
          <div>
            <dt>Delivered at</dt>
            <dd>{formatDateTime(proof.deliveredAt)}</dd>
          </div>
          {proof.deliveryNotes && (
            <div>
              <dt>Notes</dt>
              <dd>{proof.deliveryNotes}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="page-description">Delivery proof is not available for this shipment.</p>
      )}
    </section>
  )
}

export function ShipmentLoading() {
  return (
    <div className="shipment-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>Fetching your delivery updates…</p>
    </div>
  )
}
