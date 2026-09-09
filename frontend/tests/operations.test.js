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
