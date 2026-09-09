export const USER_ROLES = Object.freeze({ CUSTOMER: 'customer', DRIVER: 'driver', DISPATCHER: 'dispatcher', ADMIN: 'admin' })
export const SHIPMENT_STATUSES = Object.freeze(['BOOKED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'])
export const VEHICLE_STATUSES = Object.freeze(['available', 'assigned', 'maintenance', 'inactive'])
export const VEHICLE_TYPES = Object.freeze(['bike', 'van', 'mini_truck', 'truck'])
export const TRIP_STATUSES = Object.freeze(['planned', 'active', 'completed', 'cancelled'])
export const getDashboardPath = (role) => ({
  customer: '/customer/dashboard', driver: '/driver/dashboard',
  dispatcher: '/operations/dashboard', admin: '/operations/dashboard',
})[role] || '/unauthorized'
