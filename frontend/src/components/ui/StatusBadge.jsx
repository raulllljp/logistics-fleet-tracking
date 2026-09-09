import { formatStatus } from '../../utils/formatters'
const tones = {
  BOOKED: 'neutral', ASSIGNED: 'info', PICKED_UP: 'info', IN_TRANSIT: 'info',
  DELIVERED: 'success', FAILED: 'danger', available: 'success', assigned: 'info',
  maintenance: 'warning', inactive: 'neutral', planned: 'neutral', active: 'info',
  completed: 'success', cancelled: 'danger',
}
export default function StatusBadge({ status }) {
  return <span className={'status-badge badge-' + (tones[status] || 'neutral')}>
    <span className="status-dot" aria-hidden="true" />{formatStatus(status)}
  </span>
}
