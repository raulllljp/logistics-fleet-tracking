import { Link } from 'react-router-dom'
import StatusBadge from '../ui/StatusBadge'
import EmptyState from './EmptyState'
import { formatCurrency, formatDateTime, formatStatus } from '../../utils/formatters'

export function RouteVisual({ pickup, destination }) {
  return <div className="shipment-route"><div><small>Pickup</small><p>{pickup}</p></div><span className="route-connector" aria-hidden="true">●<i />●</span><div><small>Destination</small><p>{destination}</p></div></div>
}
export function ShipmentCard({ shipment }) {
  return <article className="shipment-card"><header><span className="shipment-reference">Shipment #{shipment._id.slice(-6).toUpperCase()}</span><StatusBadge status={shipment.status} /></header>
    <RouteVisual pickup={shipment.pickupAddress} destination={shipment.dropAddress} />
    <dl className="shipment-facts"><div><dt>Weight</dt><dd>{shipment.weight ?? '—'} kg</dd></div><div><dt>Estimated cost</dt><dd>{formatCurrency(shipment.estimatedCost)}</dd></div><div><dt>Booked</dt><dd>{formatDateTime(shipment.bookedAt)}</dd></div></dl>
    <Link className="text-action" to={'/customer/shipments/' + encodeURIComponent(shipment._id)} aria-label={'View details for shipment ' + shipment._id}>View details <span aria-hidden="true">→</span></Link>
  </article>
}
export function ShipmentList({ shipments, filtered = false }) {
  return shipments.length ? <div className="shipment-grid">{shipments.map(shipment => <ShipmentCard key={shipment._id} shipment={shipment} />)}</div> : <EmptyState title={filtered ? 'No shipments with this status' : 'No shipments yet'} message={filtered ? 'Choose another status to see more deliveries.' : 'Book your first shipment to start tracking deliveries.'}>{!filtered && <Link className="button button-primary" to="/customer/book">Book shipment</Link>}</EmptyState>
}
export function ShipmentTimeline({ history, status }) {
  const events = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  return <section className="customer-panel"><h2>Tracking timeline</h2>{status === 'FAILED' && <p className="field-error">Delivery failed. The recorded updates are shown below.</p>}
    {events.length ? <ol className="shipment-timeline">{events.map((event, index) => <li key={`${event.timestamp}-${index}`} aria-current={index === events.length - 1 ? 'step' : undefined}>
      <span className="timeline-dot" aria-hidden="true" /><div><strong>{formatStatus(event.status)}</strong><p className="timeline-time">{formatDateTime(event.timestamp)}</p>{event.location && <p>{event.location}</p>}{event.note && <p>{event.note}</p>}</div>
    </li>)}</ol> : <p className="page-description">No tracking events are available yet.</p>}</section>
}
export function DeliveryProofCard({ proof }) {
  return <section className="customer-panel proof-panel"><p className="eyebrow">DELIVERY CONFIRMATION</p><h2>Delivery proof</h2>{proof ? <dl className="proof-facts"><div><dt>Delivered to</dt><dd>{proof.receiverName}</dd></div><div><dt>Delivered at</dt><dd>{formatDateTime(proof.deliveredAt)}</dd></div>{proof.deliveryNotes && <div><dt>Notes</dt><dd>{proof.deliveryNotes}</dd></div>}</dl> : <p className="page-description">Delivery proof is not available for this shipment.</p>}</section>
}
export function ShipmentLoading() {
  return <div className="shipment-loading" role="status"><span className="spinner" aria-hidden="true" /><p>Fetching your delivery updates…</p></div>
}
