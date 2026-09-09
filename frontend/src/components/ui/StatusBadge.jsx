import { formatStatus } from '../../utils/formatters'
const tones = {
  BOOKED: 'neutral', ASSIGNED: 'info', PICKED_UP: 'info', IN_TRANSIT: 'info',
  DELIVERED: 'success', FAILED: 'danger', available: 'success', assigned: 'info',
  maintenance: 'warning', inactive: 'neutral', planned: 'neutral', active: 'info',
  completed: 'success', cancelled: 'danger',
}
export default function StatusBadge({ status, className = '' }) {
  const tone = tones[status] || 'neutral'
  return (
    <span className={`status-badge badge-${tone} ${className}`.trim()}>
      <span className="status-dot" aria-hidden="true" />
      <span>{formatStatus(status)}</span>
    </span>
  )
}
