import { useState } from 'react'
import { useOperations } from '../../hooks/useOperations'
import {
  shipments,
  dispatchPayload,
  operationRefreshScopes,
} from '../../utils/operations'
import { SHIPMENT_STATUSES } from '../../utils/constants'
import {
  formatStatus,
  formatCurrency,
  formatDateTime,
  formatShipmentId,
  formatVehicleType,
} from '../../utils/formatters'
import {
  RouteVisual,
  ShipmentTimeline,
  DeliveryProofCard,
} from '../common/ShipmentComponents'
import Button from '../ui/Button'
import Field from '../ui/Field'
import StatusBadge from '../ui/StatusBadge'
import {
  Modal,
  ActionForm,
  SelectField,
  LoadState,
  OperationsHeader,
  DataTable,
} from './OperationsUI'

export function CapacityNotice({ weight, capacity }) {
  const diff = capacity - weight
  const isExceeded = weight > capacity
  return (
    <div
      className={`capacity-box ${
        isExceeded ? 'capacity-box-insufficient' : 'capacity-box-sufficient'
      }`}
    >
      <dl className="capacity-metrics">
        <div className="capacity-metric">
          <dt>Shipment weight</dt>
          <dd>{weight} kg</dd>
        </div>
        <div className="capacity-metric">
          <dt>Vehicle capacity</dt>
          <dd>{capacity} kg</dd>
        </div>
        <div className="capacity-metric">
          <dt>Remaining nominal</dt>
          <dd style={{ color: isExceeded ? 'var(--danger)' : 'var(--color-accent)' }}>
            {isExceeded ? 'Exceeded' : `${diff} kg`}
          </dd>
        </div>
      </dl>
      <p
        className={isExceeded ? 'field-error' : 'role-note'}
        style={{ margin: 0, fontSize: '0.8rem' }}
      >
        {isExceeded
          ? 'This shipment exceeds vehicle capacity. Choose another driver/vehicle pair.'
          : 'Nominal vehicle capacity accommodates shipment weight. Live active combined workload is verified by the server.'}
      </p>
    </div>
  )
}

export function DispatchPanel({ shipment, onClose, onAssigned }) {
  const state = useOperations('available')
  const [driverId, setDriver] = useState('')
  const [done, setDone] = useState(false)
  const driver = state.data?.drivers?.find(d => d._id === driverId)
  const vehicle = driver?.vehicleId
  const hasValidVehicle = Boolean(vehicle && vehicle._id)
  const isCapacityValid = hasValidVehicle && shipment.weight <= vehicle.capacity

  return (
    <Modal title={`Assign Shipment ${formatShipmentId(shipment._id)}`} onClose={onClose}>
      {done ? (
        <div className="booking-success" role="status" style={{ margin: '1rem 0' }}>
          <strong>Shipment assigned successfully.</strong>
        </div>
      ) : (
        <LoadState state={state}>
          {/* Step 1: Selected Shipment Summary */}
          <div className="dispatch-step">
            <span className="dispatch-step-title">Step 1 — Selected Shipment</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <div>
                <strong>Shipment {formatShipmentId(shipment._id)}</strong>
                <small className="text-muted" style={{ display: 'block' }}>
                  Full ID: {shipment._id}
                </small>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="weight-prominent">Weight: {shipment.weight} kg</span>
                <StatusBadge status={shipment.status} />
              </div>
            </div>
            <RouteVisual
              pickup={shipment.pickupAddress}
              destination={shipment.dropAddress}
            />
          </div>

          <ActionForm
            canSubmit={hasValidVehicle && isCapacityValid}
            label="Confirm assignment"
            refreshScopes={operationRefreshScopes.dispatch}
            onDone={() => {
              setDone(true)
              onAssigned?.()
              onClose()
            }}
            submit={() => {
              if (!driver?.vehicleId || shipment.weight > driver.vehicleId.capacity) {
                throw new Error('Select a compatible driver and vehicle pair')
              }
              return shipments.assignShipment(shipment._id, dispatchPayload(driver))
            }}
          >
            {fieldErrors => (
              <>
                {/* Step 2: Driver Selection */}
                <div className="dispatch-step">
                  <span className="dispatch-step-title">Step 2 — Select Driver</span>
                  <p className="role-note" style={{ marginBottom: '0.75rem' }}>
                    Choose an available driver with a consistently linked vehicle.
                  </p>
                  {state.data?.drivers?.length ? (
                    <div className="dispatch-selection-grid" role="radiogroup" aria-label="Eligible drivers">
                      {state.data.drivers.map(d => {
                        const isSelected = d._id === driverId
                        return (
                          <button
                            type="button"
                            key={d._id}
                            role="radio"
                            aria-checked={isSelected}
                            className={`dispatch-card ${isSelected ? 'dispatch-card-selected' : ''}`}
                            onClick={() => setDriver(d._id)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong>{d.userId?.name || 'Driver'}</strong>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '99px',
                                  background: d.isAvailable ? '#e5f1e8' : '#ebeee8',
                                  color: d.isAvailable ? 'var(--color-accent)' : 'var(--color-muted)',
                                  fontWeight: 600,
                                }}
                              >
                                {d.isAvailable ? 'Available' : 'Paused'}
                              </span>
                            </div>
                            <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                              License: {d.licenseNumber}
                            </small>
                            <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--color-ink)' }}>
                              Vehicle: {d.vehicleId?.registrationNumber || 'No vehicle'}
                            </small>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="field-error">
                      No eligible linked drivers currently available. Ensure drivers have an active profile linked to a vehicle.
                    </p>
                  )}
                  {fieldErrors.driverId && (
                    <p className="field-error" role="alert" style={{ marginTop: '0.5rem' }}>
                      {fieldErrors.driverId}
                    </p>
                  )}
                </div>

                {/* Step 3: Vehicle Selection & Capacity Visual */}
                <div className="dispatch-step">
                  <span className="dispatch-step-title">Step 3 — Linked Vehicle & Capacity</span>
                  {driver ? (
                    driver.vehicleId ? (
                      <div>
                        <div
                          className="dispatch-card dispatch-card-selected"
                          style={{ maxWidth: '420px', cursor: 'default' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>{driver.vehicleId.registrationNumber}</strong>
                            <StatusBadge status={driver.vehicleId.status} />
                          </div>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>
                            Type: {formatVehicleType(driver.vehicleId.type)} · Capacity: {driver.vehicleId.capacity} kg
                          </p>
                          <small className="text-muted">
                            Linked to driver {driver.userId?.name || 'Driver'}
                          </small>
                        </div>

                        <CapacityNotice
                          weight={shipment.weight}
                          capacity={driver.vehicleId.capacity}
                        />
                      </div>
                    ) : (
                      <p className="field-error">
                        Selected driver does not have a linked vehicle. Link a vehicle in Drivers management before assigning.
                      </p>
                    )
                  ) : (
                    <p className="role-note">Select a driver above to inspect the linked vehicle and verify capacity.</p>
                  )}
                  {fieldErrors.vehicleId && (
                    <p className="field-error" role="alert" style={{ marginTop: '0.5rem' }}>
                      {fieldErrors.vehicleId}
                    </p>
                  )}
                </div>

                {/* Assignment Confirmation Summary */}
                {driver && driver.vehicleId && (
                  <div
                    style={{
                      background: '#edf4ed',
                      border: '1px solid #b8dcc6',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem',
                      marginBottom: '1rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <strong>Confirm Assignment:</strong> Assigning {formatShipmentId(shipment._id)} to driver{' '}
                    <strong>{driver.userId?.name || 'Driver'}</strong> driving vehicle{' '}
                    <strong>{driver.vehicleId.registrationNumber}</strong>.
                  </div>
                )}
              </>
            )}
          </ActionForm>
        </LoadState>
      )}
    </Modal>
  )
}

function ShipmentInspection({ shipment, onClose }) {
  const history = useOperations('history', { id: shipment._id })
  const driverList = useOperations('drivers')
  const vehicleList = useOperations('vehicles')

  const driver = driverList.data?.drivers?.find(d => d._id === shipment.assignedDriverId)
  const vehicle = vehicleList.data?.vehicles?.find(v => v._id === shipment.assignedVehicleId)

  return (
    <Modal title={`Shipment ${formatShipmentId(shipment._id)}`} onClose={onClose}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">SHIPMENT INSPECTION</span>
          <h2 className="full-shipment-id">Shipment {formatShipmentId(shipment._id)}</h2>
          <small className="text-muted">Full ID: {shipment._id}</small>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      <p style={{ margin: '0.5rem 0', fontWeight: 500 }}>
        Customer: {shipment.customerId?.name || 'Customer unavailable'}{' '}
        {shipment.customerId?.email && <small className="text-muted">({shipment.customerId.email})</small>}
      </p>

      <RouteVisual pickup={shipment.pickupAddress} destination={shipment.dropAddress} />

      <dl className="shipment-facts">
        <div>
          <dt>Weight / Distance</dt>
          <dd>
            {shipment.weight} kg / {shipment.distance} km
          </dd>
        </div>
        <div>
          <dt>Estimated Cost</dt>
          <dd>{formatCurrency(shipment.estimatedCost)}</dd>
        </div>
        <div>
          <dt>Driver</dt>
          <dd>{driver?.userId?.name || (shipment.assignedDriverId ? 'Assigned' : 'Not assigned')}</dd>
        </div>
        <div>
          <dt>Vehicle</dt>
          <dd>{vehicle?.registrationNumber || (shipment.assignedVehicleId ? 'Assigned' : 'Not assigned')}</dd>
        </div>
        <div>
          <dt>Booked</dt>
          <dd>{formatDateTime(shipment.bookedAt)}</dd>
        </div>
      </dl>

      <LoadState state={history}>
        {history.data && (
          <ShipmentTimeline
            history={history.data.history || []}
            status={history.data.currentStatus || shipment.status}
          />
        )}
      </LoadState>

      {shipment.status === 'DELIVERED' && (
        <DeliveryProofCard proof={shipment.deliveryProof} />
      )}
    </Modal>
  )
}

export function ShipmentsManager({ pendingOnly = false }) {
  const [status, setStatus] = useState(pendingOnly ? 'BOOKED' : '')
  const [search, setSearch] = useState('')
  const [dispatch, setDispatch] = useState(null)
  const [inspect, setInspect] = useState(null)
  const [notice, setNotice] = useState('')

  const state = useOperations('shipments', status ? { status } : {})
  const driverList = useOperations('drivers')
  const vehicleList = useOperations('vehicles')

  let rows = (state.data?.shipments || []).filter(s =>
    [s._id, s.pickupAddress, s.dropAddress, s.customerId?.name].some(value =>
      value?.toLowerCase().includes(search.toLowerCase())
    )
  )
  if (pendingOnly) rows = rows.slice(0, 5)

  // Fast lookups for assigned driver/vehicle names
  const driversById = new Map((driverList.data?.drivers || []).map(d => [d._id, d.userId?.name || 'Driver']))
  const vehiclesById = new Map((vehicleList.data?.vehicles || []).map(v => [v._id, v.registrationNumber]))

  const emptyText = pendingOnly
    ? 'No shipments awaiting dispatch'
    : 'No shipments found'

  return (
    <section className="page-stack">
      {pendingOnly ? (
        <h2>Pending dispatch</h2>
      ) : (
        <OperationsHeader title="Shipments" state={state} />
      )}

      {!pendingOnly && (
        <div className="operations-filters">
          <SelectField
            label="Shipment status"
            value={status}
            onChange={e => setStatus(e.target.value)}
            options={[['', 'All statuses'], ...SHIPMENT_STATUSES.map(v => [v, formatStatus(v)])]}
          />
          <Field
            label="Search loaded shipments"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, route, customer…"
          />
        </div>
      )}

      {notice && (
        <p role="status" className="booking-success">
          {notice}
        </p>
      )}

      <LoadState state={state}>
        <DataTable
          rows={rows}
          empty={emptyText}
          columns={[
            // 1. Status
            ['Status', s => <StatusBadge status={s.status} />],
            // 2. Shipment Identifier
            ['Shipment', s => <strong>{formatShipmentId(s._id)}</strong>],
            // 3. Route
            [
              'Route',
              s => (
                <div>
                  <span>{s.pickupAddress}</span>
                  <span className="vehicle-type">→ {s.dropAddress}</span>
                </div>
              ),
            ],
            // 4. Weight
            ['Weight', s => <span>{s.weight} kg</span>],
            // 5. Driver
            [
              'Driver',
              s =>
                s.assignedDriverId
                  ? driversById.get(s.assignedDriverId) || 'Assigned'
                  : '—',
            ],
            // 6. Vehicle
            [
              'Vehicle',
              s =>
                s.assignedVehicleId
                  ? vehiclesById.get(s.assignedVehicleId) || 'Assigned'
                  : '—',
            ],
            // 7. Actions
            [
              'Actions',
              s => (
                <div className="customer-actions">
                  {s.status === 'BOOKED' ? (
                    <Button onClick={() => setDispatch(s)}>Assign</Button>
                  ) : null}
                  <Button variant="quiet" onClick={() => setInspect(s)}>
                    Details
                  </Button>
                </div>
              ),
            ],
          ]}
        />
      </LoadState>

      {dispatch && (
        <DispatchPanel
          shipment={dispatch}
          onClose={() => setDispatch(null)}
          onAssigned={() => setNotice('Shipment assigned successfully.')}
        />
      )}

      {inspect && (
        <ShipmentInspection
          shipment={inspect}
          onClose={() => setInspect(null)}
        />
      )}
    </section>
  )
}
