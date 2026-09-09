import { Link, useParams, useLocation } from 'react-router-dom'
import { useCustomerShipments } from '../../hooks/useCustomerShipments'
import { RouteVisual, ShipmentTimeline, DeliveryProofCard, ShipmentLoading } from '../../components/common/ShipmentComponents'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import ErrorState from '../../components/common/ErrorState'
import { formatCurrency,formatDateTime,formatVehicleType } from '../../utils/formatters'
export default function ShipmentDetailPage() {
 const {id}=useParams()
 const {state}=useLocation()
 const {data,loading,error,refresh}=useCustomerShipments({id})
 const shipment=data?.shipment
 return <div className="page-stack"><header className="customer-header"><div><Link className="text-action" to="/customer/shipments">? My shipments</Link><h1>Shipment details</h1></div><Button variant="quiet" disabled={loading} onClick={refresh}>{loading ? 'Refreshing?' : 'Refresh status'}</Button></header>
 {state?.booked && <div className="booking-success" role="status"><strong>Shipment booked successfully</strong><p>Tracking has started. Your shipment is awaiting dispatch.</p></div>}
 {loading ? <ShipmentLoading /> : error ? <ErrorState title="Could not load tracking information" message={error} onRetry={refresh} /> : shipment && <>
 <section className="customer-panel"><div className="section-heading"><h2 className="full-shipment-id">Shipment #{shipment._id}</h2><StatusBadge status={shipment.currentStatus} /></div><RouteVisual pickup={shipment.pickupAddress} destination={shipment.dropAddress}/><dl className="shipment-facts"><div><dt>Weight</dt><dd>{shipment.weight} kg</dd></div><div><dt>Distance</dt><dd>{shipment.distance} km</dd></div><div><dt>Estimated cost</dt><dd>{formatCurrency(shipment.estimatedCost)}</dd></div><div><dt>Booked</dt><dd>{formatDateTime(shipment.bookedAt)}</dd></div></dl></section>
 <div className="detail-grid"><ShipmentTimeline history={data.history || []} status={shipment.currentStatus}/><div className="detail-side"><section className="customer-panel"><h2>{shipment.currentStatus==='BOOKED' ? 'Awaiting dispatch' : 'Delivery team'}</h2><dl className="proof-facts"><div><dt>Driver</dt><dd>{shipment.driver?.name || 'Not assigned yet'}</dd></div><div><dt>Vehicle</dt><dd>{shipment.vehicle ? <>{shipment.vehicle.registrationNumber}<small className="vehicle-type">{formatVehicleType(shipment.vehicle.type)}</small></> : 'Not assigned yet'}</dd></div></dl></section>{shipment.currentStatus==='DELIVERED' && <DeliveryProofCard proof={data.deliveryProof}/>}</div></div></>}
 </div>
}
