import { useRef, useState } from 'react'
import Button from '../ui/Button'
import Field from '../ui/Field'
import StatusBadge from '../ui/StatusBadge'
import ErrorState from '../common/ErrorState'
import EmptyState from '../common/EmptyState'
import {
  RouteVisual,
  ShipmentTimeline,
  DeliveryProofCard,
  ShipmentLoading,
} from '../common/ShipmentComponents'
import { useDriverData } from '../../hooks/useDriverData'
import {
  nextActions,
  actionLabels,
  actionSuccessMessages,
  statusPayload,
  validateStatus,
  driverError,
} from '../../utils/driverWorkflow'
import { updateShipmentStatus } from '../../api/shipmentApi'
import {
  formatDateTime,
  formatVehicleType,
  formatShipmentId,
} from '../../utils/formatters'

export function DriverProfileCard({ driver }) {
  return (
    <section className="customer-panel">
      <p className="eyebrow">YOUR DRIVER PROFILE</p>
      <h2>{driver.userId?.name || 'Driver profile'}</h2>
      <dl className="proof-facts">
        <div>
          <dt>Availability for new assignments</dt>
          <dd>{driver.isAvailable ? 'Available' : 'Paused by operations'}</dd>
        </div>
        <div>
          <dt>License</dt>
          <dd>{driver.licenseNumber || 'Not provided'}</dd>
        </div>
        <div>
          <dt>Linked vehicle</dt>
          <dd>
            {driver.vehicleId ? (
              <>
                {driver.vehicleId.registrationNumber}
                <small className="vehicle-type">
                  {formatVehicleType(driver.vehicleId.type)}
                </small>
              </>
            ) : (
              'No vehicle linked yet'
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}

export function StatusUpdateForm({
  shipment,
  target,
  onCancel,
  onUpdated,
  onConflict,
}) {
  const [values, setValues] = useState({
    receiverName: '',
    location: '',
    note: '',
    deliveryNotes: '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const lock = useRef(false)
  const form = useRef(null)

  const isDelivered = target === 'DELIVERED'
  const isFailed = target === 'FAILED'

  const submit = async event => {
    event.preventDefault()
    if (lock.current) return
    const invalid = validateStatus(target, values)
    setErrors(invalid)
    if (Object.keys(invalid).length) {
      form.current.elements.namedItem(Object.keys(invalid)[0])?.focus()
      return
    }
    if (!nextActions(shipment.status).includes(target)) {
      setMessage('Refresh this shipment before continuing.')
      return
    }
    lock.current = true
    setPending(true)
    setMessage('')
    try {
      await updateShipmentStatus(shipment._id, statusPayload(target, values))
      onUpdated(target)
    } catch (error) {
      if (
        error.response?.status === 409 ||
        error.response?.data?.errorCode === 'SHIPMENT_NOT_ASSIGNED_TO_DRIVER'
      ) {
        onConflict(driverError(error))
        return
      }
      setMessage(driverError(error))
      if (
        error.response?.data?.errorCode === 'VALIDATION_ERROR' &&
        Array.isArray(error.response.data.errors)
      ) {
        const fields = {}
        for (const item of error.response.data.errors) {
          if (Object.hasOwn(values, item.field) && typeof item.message === 'string') {
            fields[item.field] = item.message
          }
        }
        setErrors(fields)
      }
    } finally {
      lock.current = false
      setPending(false)
    }
  }

  return (
    <form
      className="driver-action-panel"
      ref={form}
      noValidate
      onSubmit={submit}
      aria-busy={pending}
    >
      <h3>{isFailed ? 'Mark this delivery as failed?' : actionLabels[target]}</h3>

      {/* Confirmation Summary */}
      <div className="role-note" style={{ marginBottom: '1rem' }}>
        <strong>Shipment:</strong> {formatShipmentId(shipment._id)} ·{' '}
        <strong>Destination:</strong> {shipment.dropAddress}
      </div>

      {isFailed && (
        <div
          className="auth-feedback"
          role="alert"
          style={{
            borderColor: 'var(--danger)',
            background: '#fcefeb',
            color: 'var(--danger)',
            marginBottom: '1rem',
          }}
        >
          <strong>Warning:</strong> Confirm only if this delivery attempt has failed.
          This ends the current shipment workflow and cannot be undone here.
        </div>
      )}

      {isDelivered && (
        <p className="role-note" style={{ marginBottom: '1rem' }}>
          Confirm that the shipment has reached the receiver. This completes the delivery
          and cannot be undone here.
        </p>
      )}

      <fieldset className="auth-fields" disabled={pending}>
        <legend className="sr-only">Status confirmation</legend>

        {isDelivered && (
          <Field
            label="Receiver name (required)"
            name="receiverName"
            autoFocus
            required
            value={values.receiverName}
            error={errors.receiverName}
            onChange={event =>
              setValues({ ...values, receiverName: event.target.value })
            }
          />
        )}

        <Field
          label={
            isDelivered
              ? 'Delivery drop location (optional, e.g. Gate 2, Reception)'
              : 'Current location (optional)'
          }
          name="location"
          autoFocus={!isDelivered}
          value={values.location}
          error={errors.location}
          onChange={event => setValues({ ...values, location: event.target.value })}
        />

        {isDelivered && (
          <Field
            label="Delivery confirmation notes (optional, proof for receiver)"
            name="deliveryNotes"
            value={values.deliveryNotes}
            error={errors.deliveryNotes}
            onChange={event =>
              setValues({ ...values, deliveryNotes: event.target.value })
            }
          />
        )}

        <Field
          label={
            isFailed
              ? 'Failure reason / operational note (recommended)'
              : 'Internal operational note (optional)'
          }
          name="note"
          value={values.note}
          error={errors.note}
          onChange={event => setValues({ ...values, note: event.target.value })}
        />

        <div className="customer-actions">
          <Button
            type="submit"
            variant={isFailed ? 'quiet' : 'primary'}
            style={isFailed ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : undefined}
          >
            {pending
              ? 'Saving…'
              : isDelivered
              ? 'Confirm delivery'
              : isFailed
              ? 'Confirm failed delivery'
              : 'Confirm update'}
          </Button>
          <Button variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </fieldset>

      {message && (
        <p role="alert" className="field-error" style={{ marginTop: '0.75rem' }}>
          {message}
        </p>
      )}
      {Object.values(errors).some(Boolean) && (
        <p role="alert" className="field-error" style={{ marginTop: '0.5rem' }}>
          Please check the highlighted fields.
        </p>
      )}
    </form>
  )
}

function DriverHistory({ id }) {
  const state = useDriverData('history', '', id)
  return state.loading ? (
    <ShipmentLoading />
  ) : state.error ? (
    <ErrorState
      title="Could not load shipment history"
      message={state.error}
      onRetry={state.refresh}
    />
  ) : (
    <ShipmentTimeline
      history={state.data.history || []}
      status={state.data.currentStatus}
    />
  )
}

export function DriverShipmentCard({ shipment, onRefresh, onFeedback }) {
  const [target, setTarget] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const actions = nextActions(shipment.status)
  const actionArea = useRef(null)

  const cancel = () => {
    setTarget(null)
    actionArea.current?.focus()
  }

  const handleUpdated = targetStatus => {
    setTarget(null)
    const successMsg =
      actionSuccessMessages[targetStatus] || 'Shipment updated successfully.'
    onFeedback(successMsg)
    onRefresh()
  }

  return (
    <article className="shipment-card driver-shipment">
      {/* 1. Route Visual */}
      <RouteVisual
        pickup={shipment.pickupAddress}
        destination={shipment.dropAddress}
      />

      {/* 2. Identifier and Status */}
      <header style={{ marginTop: '1rem' }}>
        <span className="shipment-reference">{formatShipmentId(shipment._id)}</span>
        <StatusBadge status={shipment.status} />
      </header>

      {/* 3. Prominent Weight */}
      <div style={{ margin: '1rem 0' }}>
        <span className="weight-prominent">
          <span>Weight:</span> {shipment.weight ?? '—'} kg
        </span>
      </div>

      {/* 4. Next Actions */}
      <div className="customer-actions" ref={actionArea} tabIndex={-1}>
        {actions.map(action => (
          <Button
            key={action}
            variant={action === 'FAILED' ? 'quiet' : 'primary'}
            disabled={Boolean(target)}
            onClick={() => setTarget(action)}
          >
            {actionLabels[action]}
          </Button>
        ))}
        {!actions.length && (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            {shipment.status === 'DELIVERED'
              ? 'Delivery completed'
              : shipment.status === 'FAILED'
              ? 'Delivery failed'
              : 'No driver action available'}
          </p>
        )}
      </div>

      {/* Status Update Form / Terminal Confirmation */}
      {target && (
        <StatusUpdateForm
          shipment={shipment}
          target={target}
          onCancel={cancel}
          onUpdated={handleUpdated}
          onConflict={message => {
            setTarget(null)
            onFeedback(message)
            onRefresh()
          }}
        />
      )}

      {/* Details Toggle */}
      <Button
        variant="quiet"
        className="driver-detail-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Hide shipment details' : 'View shipment details'}
      </Button>

      {expanded && (
        <div className="detail-side" style={{ marginTop: '1rem' }}>
          <p className="full-shipment-id">
            Shipment {formatShipmentId(shipment._id)}{' '}
            <small className="text-muted">({shipment._id})</small>
          </p>
          <DriverHistory id={shipment._id} />
          {shipment.status === 'DELIVERED' && (
            <DeliveryProofCard proof={shipment.deliveryProof} />
          )}
        </div>
      )}
    </article>
  )
}

export function DriverShipmentList({
  shipments,
  onRefresh,
  onFeedback,
  filtered = false,
}) {
  return shipments.length ? (
    <div className="shipment-grid">
      {shipments.map(shipment => (
        <DriverShipmentCard
          key={shipment._id}
          shipment={shipment}
          onRefresh={onRefresh}
          onFeedback={onFeedback}
        />
      ))}
    </div>
  ) : (
    <EmptyState
      title={filtered ? 'No shipments with this status' : 'No assigned shipments'}
      message={
        filtered
          ? 'Choose another status to view your assignments.'
          : 'You’re all caught up. Assigned deliveries will appear here.'
      }
    />
  )
}

export function TripCard({ trip }) {
  return (
    <article className="customer-panel">
      <div className="section-heading">
        <h2>Trip #{trip._id.slice(-6).toUpperCase()}</h2>
        <StatusBadge status={trip.status} />
      </div>
      <dl className="shipment-facts">
        <div>
          <dt>Date</dt>
          <dd>{formatDateTime(trip.date)}</dd>
        </div>
        <div>
          <dt>Vehicle</dt>
          <dd>
            {trip.vehicleId?.registrationNumber || 'Vehicle unavailable'}
            {trip.vehicleId?.type && (
              <small className="vehicle-type">
                {formatVehicleType(trip.vehicleId.type)}
              </small>
            )}
          </dd>
        </div>
        <div>
          <dt>Shipments listed</dt>
          <dd>{trip.shipmentIds?.length || 0}</dd>
        </div>
      </dl>
      <details className="trip-details">
        <summary>View trip shipments</summary>
        {trip.shipmentIds?.length ? (
          trip.shipmentIds.map(shipment => (
            <div key={shipment._id} className="trip-shipment">
              <StatusBadge status={shipment.status} />
              <RouteVisual
                pickup={shipment.pickupAddress}
                destination={shipment.dropAddress}
              />
            </div>
          ))
        ) : (
          <p>No shipment details are available.</p>
        )}
      </details>
    </article>
  )
}

export function DriverTripsList({ trips }) {
  return trips.length ? (
    <div className="shipment-grid">
      {trips.map(trip => (
        <TripCard key={trip._id} trip={trip} />
      ))}
    </div>
  ) : (
    <EmptyState
      title="No trips"
      message="No trips are currently assigned."
    />
  )
}
