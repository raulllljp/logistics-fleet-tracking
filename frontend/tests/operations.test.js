import test from 'node:test'
import assert from 'node:assert/strict'
import { SHIPMENT_STATUSES, VEHICLE_STATUSES, VEHICLE_TYPES, TRIP_STATUSES } from '../src/utils/constants.js'
import {
  dispatchPayload,
  vehiclePayload,
  driverPayload,
  tripPayload,
  tripActions,
  eligibleShipments,
  shipmentExclusionReason,
  operationRefreshScopes,
  operationsError,
} from '../src/utils/operations.js'
import { refreshOperations } from '../src/hooks/useOperations.js'

test('operations payloads contain only contract fields', () => {
  assert.deepEqual(dispatchPayload({ _id: 'driver-1', vehicleId: { _id: 'vehicle-1' }, status: 'available' }), {
    driverId: 'driver-1', vehicleId: 'vehicle-1',
  })
  assert.deepEqual(vehiclePayload({ registrationNumber: ' mh12 ', type: 'van', capacity: '500', status: 'available', currentDriverId: 'driver-1' }), {
    registrationNumber: 'mh12', type: 'van', capacity: 500, status: 'available',
  })
  assert.deepEqual(vehiclePayload({ registrationNumber: 'mh12', type: 'van', capacity: '500', status: 'available', currentDriverId: 'driver-1' }), {
    registrationNumber: 'mh12', type: 'van', capacity: 500, status: 'available',
  })
  assert.deepEqual(driverPayload({ userId: 'user-1', vehicleId: 'vehicle-1', licenseNumber: ' lic ', phone: ' 1234567 ', isAvailable: 'false' }, true), {
    licenseNumber: 'lic', phone: '1234567', isAvailable: false,
  })
  assert.deepEqual(tripPayload({ driverId: 'driver-1', vehicleId: 'vehicle-1', shipmentIds: ['shipment-1'], date: '2026-09-09T00:00:00.000Z', status: 'planned' }), {
    driverId: 'driver-1', vehicleId: 'vehicle-1', shipmentIds: ['shipment-1'], date: '2026-09-09T00:00:00.000Z',
  })
})

test('operations filters and workflow values remain canonical', () => {
  assert.deepEqual(SHIPMENT_STATUSES, ['BOOKED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'])
  assert.deepEqual(VEHICLE_STATUSES, ['available', 'assigned', 'maintenance', 'inactive'])
  assert.deepEqual(VEHICLE_TYPES, ['bike', 'van', 'mini_truck', 'truck'])
  assert.deepEqual(TRIP_STATUSES, ['planned', 'active', 'completed', 'cancelled'])
  assert.deepEqual(tripActions('planned'), ['active', 'cancelled'])
  assert.deepEqual(tripActions('active'), ['completed', 'cancelled'])
  assert.deepEqual(tripActions('completed'), [])
  assert.deepEqual(tripActions('cancelled'), [])
})

test('trip eligibility excludes incompatible shipments with readable reasons', () => {
  const driver = { _id: 'driver-1', vehicleId: { _id: 'vehicle-1' } }
  const shipments = [
    { _id: 'eligible', status: 'ASSIGNED', assignedDriverId: 'driver-1', assignedVehicleId: 'vehicle-1' },
    { _id: 'other-driver', status: 'ASSIGNED', assignedDriverId: 'driver-2', assignedVehicleId: 'vehicle-1' },
    { _id: 'other-vehicle', status: 'IN_TRANSIT', assignedDriverId: 'driver-1', assignedVehicleId: 'vehicle-2' },
    { _id: 'terminal', status: 'DELIVERED', assignedDriverId: 'driver-1', assignedVehicleId: 'vehicle-1' },
    { _id: 'occupied', status: 'PICKED_UP', assignedDriverId: 'driver-1', assignedVehicleId: 'vehicle-1' },
  ]
  const trips = [{ status: 'planned', shipmentIds: ['occupied'] }]
  assert.deepEqual(eligibleShipments(shipments, driver, trips).map(item => item._id), ['eligible'])
  assert.equal(shipmentExclusionReason(shipments[1], driver, trips), 'Assigned to another driver.')
  assert.equal(shipmentExclusionReason(shipments[2], driver, trips), 'Assigned to another vehicle.')
  assert.equal(shipmentExclusionReason(shipments[3], driver, trips), 'Shipment status is not eligible for trip grouping.')
  assert.equal(shipmentExclusionReason(shipments[4], driver, trips), 'Already part of a planned or active trip.')
})

test('operations errors expose safe conflict feedback for required codes', () => {
  const expected = {
    SHIPMENT_NOT_FOUND: 'This shipment could not be found. It may have been removed or changed.',
    DRIVER_PROFILE_NOT_FOUND: 'The selected driver profile could not be found.',
    VEHICLE_NOT_FOUND: 'The selected vehicle could not be found.',
    VEHICLE_CAPACITY_EXCEEDED: 'The vehicle has insufficient remaining capacity. Choose another pair or wait for deliveries to finish.',
    DRIVER_VEHICLE_MISMATCH: 'The driver and vehicle must be linked consistently. Refresh and check their linkage.',
    VEHICLE_ASSIGNED: 'Active shipment work prevents this change.',
    SHIPMENT_ALREADY_IN_TRIP: 'A selected shipment already belongs to a planned or active trip.',
    TRIP_HAS_ACTIVE_SHIPMENTS: 'This trip cannot be completed until all shipments are delivered or failed.',
    SHIPMENT_NOT_BOOKABLE: 'Only booked shipments can be dispatched.',
    SHIPMENT_ALREADY_ASSIGNED: 'This shipment has already been assigned. Refresh the list.',
    DRIVER_UNAVAILABLE: 'This driver is unavailable for more work.',
    VEHICLE_UNAVAILABLE: 'This vehicle is unavailable. Check its linkage and active work.',
    VEHICLE_MAINTENANCE: 'This vehicle is in maintenance.',
    VEHICLE_INACTIVE: 'This vehicle is inactive.',
  }
  for (const [errorCode, message] of Object.entries(expected)) assert.equal(operationsError({ response: { data: { errorCode } } }), message)
})

test('successful mutations publish only the requested operation refresh scopes', () => {
  const previousWindow = global.window
  global.window = new EventTarget()
  const received = []
  global.window.addEventListener('operations:refresh', event => received.push(event.detail.scopes))
  refreshOperations(operationRefreshScopes.dispatch)
  refreshOperations(operationRefreshScopes.trip)
  assert.deepEqual(received, [operationRefreshScopes.dispatch, operationRefreshScopes.trip])
  global.window = previousWindow
})

test('capacity notice displays remaining nominal capacity and error when exceeded', async () => {
  const { createServer } = await import('vite')
  const { createElement } = await import('react')
  const { renderToString } = await import('react-dom/server')
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const { CapacityNotice } = await vite.ssrLoadModule('/src/components/operations/ShipmentManagement.jsx')
    const sufficient = renderToString(createElement(CapacityNotice, { weight: 400, capacity: 1000 }))
    assert.match(sufficient, /capacity-box-sufficient/)
    assert.match(sufficient, /600 kg/)
    assert.match(sufficient, /sufficient/i)

    const exceeded = renderToString(createElement(CapacityNotice, { weight: 1200, capacity: 1000 }))
    assert.match(exceeded, /capacity-box-insufficient/)
    assert.match(exceeded, /Exceeded/)
    assert.match(exceeded, /exceeds/i)
  } finally { await vite.close() }
})

test('reporting charts render empty states without NaN and display SLA disclosure', async () => {
  const { createServer } = await import('vite')
  const { createElement } = await import('react')
  const { renderToString } = await import('react-dom/server')
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const { default: DeliveryPerformanceChart } = await vite.ssrLoadModule('/src/components/charts/DeliveryPerformanceChart.jsx')
    const { default: FleetUtilizationChart } = await vite.ssrLoadModule('/src/components/charts/FleetUtilizationChart.jsx')
    const { default: ShipmentStatusChart } = await vite.ssrLoadModule('/src/components/charts/ShipmentStatusChart.jsx')
    const { default: DriverWorkloadChart } = await vite.ssrLoadModule('/src/components/charts/DriverWorkloadChart.jsx')
    const { default: TripSummaryChart } = await vite.ssrLoadModule('/src/components/charts/TripSummaryChart.jsx')

    // Empty states
    const emptyDelivery = renderToString(createElement(DeliveryPerformanceChart, { data: {} }))
    assert.match(emptyDelivery, /No completed deliveries/)
    assert.doesNotMatch(emptyDelivery, /NaN/)

    const emptyFleet = renderToString(createElement(FleetUtilizationChart, { data: {} }))
    assert.match(emptyFleet, /No fleet vehicles/)
    assert.doesNotMatch(emptyFleet, /NaN/)

    const emptyStatus = renderToString(createElement(ShipmentStatusChart, { data: {} }))
    assert.match(emptyStatus, /No shipment records/)
    assert.doesNotMatch(emptyStatus, /NaN/)

    const emptyWorkload = renderToString(createElement(DriverWorkloadChart, { data: {} }))
    assert.match(emptyWorkload, /No driver profiles/)
    assert.doesNotMatch(emptyWorkload, /NaN/)

    const emptyTrip = renderToString(createElement(TripSummaryChart, { data: {} }))
    assert.match(emptyTrip, /No trips recorded/)
    assert.doesNotMatch(emptyTrip, /NaN/)

    // Populated state with SLA copy disclosure
    const populatedDelivery = renderToString(createElement(DeliveryPerformanceChart, {
      data: {
        totalCompletedAttempts: 10,
        deliveredShipments: 9,
        failedShipments: 1,
        onTimeDelivered: 8,
        averageDeliveryDurationHours: 14.5,
        deliverySuccessPercentage: 90,
        onTimeDeliveryPercentage: 88.9,
        deliverySlaHours: 48,
      },
    }))
    assert.match(populatedDelivery, /48-hour academic SLA/)
    assert.match(populatedDelivery, /90.*Success/)
    assert.match(populatedDelivery, /88\.9/)
    assert.match(populatedDelivery, /14\.5/)
  } finally { await vite.close() }
})

