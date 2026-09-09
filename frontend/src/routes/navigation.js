const customer = [
  { to: '/customer/dashboard', label: 'Dashboard' }, { to: '/customer/book', label: 'Book shipment' },
  { to: '/customer/shipments', label: 'My shipments' },
]
const driver = [
  { to: '/driver/dashboard', label: 'Dashboard' }, { to: '/driver/shipments', label: 'Assigned shipments' },
  { to: '/driver/trips', label: 'My trips' },
]
const operations = [
  { to: '/operations/dashboard', label: 'Overview' }, { to: '/operations/shipments', label: 'Shipments' },
  { to: '/operations/drivers', label: 'Drivers' }, { to: '/operations/vehicles', label: 'Vehicles' },
  { to: '/operations/trips', label: 'Trips' }, { to: '/operations/reports', label: 'Reports' },
]
export const navigationForRole = (role) => ({ customer, driver, dispatcher: operations, admin: operations })[role] || []
