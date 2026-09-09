import { Link, useParams, useLocation } from 'react-router-dom'
import { useCustomerShipments } from '../../hooks/useCustomerShipments'
import {
  RouteVisual,
  ShipmentTimeline,
  DeliveryProofCard,
  ShipmentLoading,
} from '../../components/common/ShipmentComponents'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import ErrorState from '../../components/common/ErrorState'
import {
  formatCurrency,
  formatDateTime,
  formatVehicleType,
  formatShipmentId,
  formatShipmentStateMessage,
} from '../../utils/formatters'

export default function ShipmentDetailPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const { data, loading, refreshing, error, refresh } = useCustomerShipments({ id })
  const shipment = data?.shipment

  return (
    <div className="page-stack">
      <header className="customer-header">
        <div>
          <Link className="text-action" to="/customer/shipments">
            ← My shipments
          </Link>
          <h1>Shipment details</h1>
          <p className="page-description text-muted">
            Tracking {formatShipmentId(id)} · <small>ID: {id}</small>
          </p>
        </div>
        <div className="customer-actions">
          <Button variant="quiet" disabled={loading || refreshing} onClick={refresh}>
            {refreshing ? 'Refreshing…' : 'Refresh status'}
          </Button>
        </div>
      </header>

      {state?.booked && (
        <div className="booking-success" role="status">
          <strong>Shipment booked successfully</strong>
          <p>Tracking has started. Your shipment is waiting to be assigned to a driver.</p>
        </div>
      )}

      {error && shipment && (
        <div className="auth-feedback" role="alert">
          <p>
            Could not refresh latest updates: {error}{' '}
            <button type="button" className="text-action" onClick={refresh}>
              Try again
            </button>
          </p>
        </div>
      )}

      {loading && !shipment ? (
        <ShipmentLoading />
      ) : error && !shipment ? (
        <ErrorState
          title="Could not load tracking information"
          message={error}
          onRetry={refresh}
        />
      ) : (
        shipment && (
          <>
            {/* 1. Identifier, 2. Status & Context Message, 3. Route Motif */}
            <section className="customer-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">SHIPMENT OVERVIEW</span>
                  <h2 className="full-shipment-id">Shipment {formatShipmentId(shipment._id)}</h2>
                </div>
                <StatusBadge status={shipment.currentStatus} />
              </div>
              <p className="page-description" style={{ marginTop: '0.5rem', fontWeight: 500 }}>
                {formatShipmentStateMessage(shipment.currentStatus)}
              </p>
              <RouteVisual
                pickup={shipment.pickupAddress}
                destination={shipment.dropAddress}
              />
            </section>

            {/* 4. Tracking Timeline Journey */}
            <ShipmentTimeline
              history={data.history || []}
              status={shipment.currentStatus}
            />

            {/* 5. Shipment Facts & 6. Assigned Delivery Team */}
            <div className="detail-grid">
              <section className="customer-panel">
                <h2>Shipment details</h2>
                <dl className="shipment-facts">
                  <div>
                    <dt>Weight</dt>
                    <dd>{shipment.weight ?? '—'} kg</dd>
                  </div>
                  <div>
                    <dt>Distance</dt>
                    <dd>{shipment.distance ?? '—'} km</dd>
                  </div>
                  <div>
                    <dt>Estimated cost</dt>
                    <dd>{formatCurrency(shipment.estimatedCost)}</dd>
                  </div>
                  <div>
                    <dt>Booked</dt>
                    <dd>{formatDateTime(shipment.bookedAt)}</dd>
                  </div>
                </dl>
              </section>

              <div className="detail-side">
                <section className="customer-panel">
                  <h2>
                    {shipment.currentStatus === 'BOOKED'
                      ? 'Awaiting assignment'
                      : 'Delivery team'}
                  </h2>
                  <dl className="proof-facts">
                    <div>
                      <dt>Driver</dt>
                      <dd>{shipment.driver?.name || 'Not assigned yet'}</dd>
                    </div>
                    <div>
                      <dt>Vehicle</dt>
                      <dd>
                        {shipment.vehicle ? (
                          <>
                            {shipment.vehicle.registrationNumber}
                            <small className="vehicle-type">
                              {formatVehicleType(shipment.vehicle.type)}
                            </small>
                          </>
                        ) : (
                          'Not assigned yet'
                        )}
                      </dd>
                    </div>
                  </dl>
                </section>

                {/* 7. Delivery Proof if Delivered */}
                {shipment.currentStatus === 'DELIVERED' && (
                  <DeliveryProofCard proof={data.deliveryProof} />
                )}
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}
