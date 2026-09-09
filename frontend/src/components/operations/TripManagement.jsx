import { useState } from 'react'
import { useOperations } from '../../hooks/useOperations'
import {
  trips,
  refId,
  eligibleShipments,
  shipmentOptions,
  tripActions,
  tripPayload,
  operationRefreshScopes,
} from '../../utils/operations'
import { TRIP_STATUSES } from '../../utils/constants'
import { formatStatus, formatShipmentId } from '../../utils/formatters'
import { TripCard } from '../driver/DriverComponents'
import StatusBadge from '../ui/StatusBadge'
import Button from '../ui/Button'
import EmptyState from '../common/EmptyState'
import Field from '../ui/Field'
import {
  Modal,
  ActionForm,
  SelectField,
  LoadState,
  OperationsHeader,
  ConfirmDialog,
} from './OperationsUI'

function CreateTrip({ onClose }) {
  const driverState = useOperations('drivers')
  const shipmentState = useOperations('shipments')
  const tripState = useOperations('trips')
  const vehicleState = useOperations('vehicles')
  const [driverId, setDriver] = useState('')
  const [selected, setSelected] = useState([])
  const [date, setDate] = useState('')

  const driver = driverState.data?.drivers.find(d => d._id === driverId)
  const options = shipmentOptions(
    shipmentState.data?.shipments || [],
    driver,
    tripState.data?.trips || []
  )
  const eligible = eligibleShipments(
    shipmentState.data?.shipments || [],
    driver,
    tripState.data?.trips || []
  )
  const state =
    [driverState, shipmentState, tripState, vehicleState].find(
      s => s.loading || s.error
    ) || driverState

  return (
    <Modal title="Create Trip" onClose={onClose}>
      <LoadState state={state}>
        <ActionForm
          canSubmit={
            Boolean(driver) &&
            selected.length > 0 &&
            selected.every(id => eligible.some(s => s._id === id))
          }
          label="Create trip"
          refreshScopes={operationRefreshScopes.trip}
          onDone={onClose}
          submit={() => {
            if (
              !driver ||
              !selected.length ||
              selected.some(id => !eligible.some(s => s._id === id))
            ) {
              throw new Error('Select eligible shipments')
            }
            return trips.createTrip(
              tripPayload({
                driverId,
                vehicleId: refId(driver.vehicleId),
                shipmentIds: selected,
                date: date ? new Date(date).toISOString() : '',
              })
            )
          }}
        >
          {fieldErrors => (
            <>
              <SelectField
                label="Driver and linked vehicle"
                error={fieldErrors.driverId}
                required
                value={driverId}
                onChange={e => {
                  setDriver(e.target.value)
                  setSelected([])
                }}
                options={[
                  ['', 'Choose driver and vehicle pair'],
                  ...(driverState.data?.drivers || [])
                    .filter(
                      d =>
                        d.vehicleId &&
                        (vehicleState.data?.vehicles || []).some(
                          v =>
                            v._id === refId(d.vehicleId) &&
                            refId(v.currentDriverId) === d._id
                        )
                    )
                    .map(d => [
                      d._id,
                      (d.userId?.name || 'Driver') +
                        ' · ' +
                        d.vehicleId.registrationNumber,
                    ]),
                ]}
              />

              <Field
                label="Trip scheduled date/time (optional, local time)"
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
              />

              <fieldset className="trip-selection">
                <legend>Select active shipments for trip</legend>
                {options.map(({ shipment, reason }) => (
                  <label
                    key={shipment._id}
                    className={reason ? 'trip-option-disabled' : ''}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      padding: '0.6rem 0',
                      borderBottom: '1px solid var(--color-line)',
                    }}
                  >
                    <input
                      type="checkbox"
                      disabled={Boolean(reason)}
                      checked={selected.includes(shipment._id)}
                      onChange={e =>
                        setSelected(
                          e.target.checked
                            ? [...selected, shipment._id]
                            : selected.filter(id => id !== shipment._id)
                        )
                      }
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong>{formatShipmentId(shipment._id)}</strong>
                        <StatusBadge status={shipment.status} />
                        <span>({shipment.weight} kg)</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        {shipment.pickupAddress} → {shipment.dropAddress}
                      </div>
                      {reason && (
                        <small className="field-error" style={{ display: 'block', marginTop: '0.2rem' }}>
                          {reason}
                        </small>
                      )}
                    </div>
                  </label>
                ))}
                {!options.length && (
                  <p className="text-muted">No shipments currently available for trip grouping.</p>
                )}
              </fieldset>

              {fieldErrors.shipmentIds && (
                <p className="field-error" role="alert">
                  {fieldErrors.shipmentIds}
                </p>
              )}

              <p className="role-note">
                Only active assigned shipments (`ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`) matching the selected driver and vehicle can be grouped into a trip.
              </p>
            </>
          )}
        </ActionForm>
      </LoadState>
    </Modal>
  )
}

export function TripsManager() {
  const [status, setStatus] = useState('')
  const [create, setCreate] = useState(false)
  const [action, setAction] = useState(null)
  const state = useOperations('trips', status ? { status } : {})

  return (
    <div className="page-stack">
      <OperationsHeader title="Trips" state={state}>
        <Button onClick={() => setCreate(true)}>Create trip</Button>
      </OperationsHeader>

      <SelectField
        label="Trip status"
        value={status}
        onChange={e => setStatus(e.target.value)}
        options={[['', 'All statuses'], ...TRIP_STATUSES.map(v => [v, formatStatus(v)])]}
      />

      <LoadState state={state}>
        {state.data?.trips?.length ? (
          <div className="shipment-grid">
            {state.data.trips.map(trip => (
              <div key={trip._id}>
                <TripCard trip={trip} />
                <div className="customer-actions" style={{ marginTop: '0.75rem' }}>
                  {tripActions(trip.status).map(next => (
                    <Button
                      key={next}
                      variant="quiet"
                      onClick={() => setAction({ trip, next })}
                    >
                      {formatStatus(next)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No trips yet"
            message="Create a trip from active assigned shipments."
          />
        )}
      </LoadState>

      {create && <CreateTrip onClose={() => setCreate(false)} />}

      {action && (
        <ConfirmDialog
          title={`Set trip to ${formatStatus(action.next)}?`}
          message={
            action.next === 'cancelled'
              ? 'Cancellation ends this trip. It does not cancel its shipments.'
              : action.next === 'completed'
              ? 'All shipments must be delivered or failed before completion.'
              : 'Start this planned trip?'
          }
          submit={() => trips.updateTripStatus(action.trip._id, { status: action.next })}
          refreshScopes={operationRefreshScopes.trip}
          onClose={() => setAction(null)}
        />
      )}
    </div>
  )
}
