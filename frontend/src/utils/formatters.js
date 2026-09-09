const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
export const formatCurrency = (value) => typeof value === 'number' && Number.isFinite(value) ? money.format(value) : '—'
export const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
const labels = {
  BOOKED: 'Booked', ASSIGNED: 'Assigned', PICKED_UP: 'Picked up', IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered', FAILED: 'Failed', available: 'Available', assigned: 'Assigned',
  maintenance: 'Maintenance', inactive: 'Inactive', planned: 'Planned', active: 'Active',
  completed: 'Completed', cancelled: 'Cancelled', bike: 'Bike', van: 'Van',
  mini_truck: 'Mini truck', truck: 'Truck',
}
export const formatStatus = (status) => labels[status] || 'Unknown'
export const formatVehicleType = (type) => labels[type] || 'Unknown'
