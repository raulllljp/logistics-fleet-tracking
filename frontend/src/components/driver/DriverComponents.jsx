import { useRef, useState } from 'react'
import Button from '../ui/Button'
import Field from '../ui/Field'
import StatusBadge from '../ui/StatusBadge'
import ErrorState from '../common/ErrorState'
import EmptyState from '../common/EmptyState'
import { RouteVisual, ShipmentTimeline, DeliveryProofCard, ShipmentLoading } from '../common/ShipmentComponents'
import { useDriverData } from '../../hooks/useDriverData'
import { nextActions, actionLabels, statusPayload, validateStatus, driverError } from '../../utils/driverWorkflow'
import { updateShipmentStatus } from '../../api/shipmentApi'
import { formatDateTime, formatVehicleType } from '../../utils/formatters'

export function DriverProfileCard({ driver }) {
 return <section className="customer-panel"><p className="eyebrow">YOUR DRIVER PROFILE</p><h2>{driver.userId?.name || 'Driver profile'}</h2><dl className="proof-facts"><div><dt>Availability for new assignments</dt><dd>{driver.isAvailable ? 'Available' : 'Paused by operations'}</dd></div><div><dt>License</dt><dd>{driver.licenseNumber || 'Not provided'}</dd></div><div><dt>Linked vehicle</dt><dd>{driver.vehicleId ? <>{driver.vehicleId.registrationNumber}<small className="vehicle-type">{formatVehicleType(driver.vehicleId.type)}</small></> : 'No vehicle linked yet'}</dd></div></dl></section>
}
export function StatusUpdateForm({ shipment, target, onCancel, onUpdated, onConflict }) {
 const [values,setValues]=useState({receiverName:'',location:'',note:'',deliveryNotes:''})
 const [errors,setErrors]=useState({})
 const [message,setMessage]=useState('')
 const [pending,setPending]=useState(false)
 const lock=useRef(false)
 const form=useRef(null)
 const submit=async event=>{
  event.preventDefault()
  if(lock.current) return
  const invalid=validateStatus(target,values)
  setErrors(invalid)
  if(Object.keys(invalid).length) { form.current.elements.namedItem(Object.keys(invalid)[0])?.focus();return }
  if(!nextActions(shipment.status).includes(target)) {setMessage('Refresh this shipment before continuing.');return}
  lock.current=true;setPending(true);setMessage('')
  try {await updateShipmentStatus(shipment._id,statusPayload(target,values));onUpdated()}
  catch(error){
   if(error.response?.status===409 || error.response?.data?.errorCode==='SHIPMENT_NOT_ASSIGNED_TO_DRIVER') {onConflict(driverError(error));return}
   setMessage(driverError(error))
   if(error.response?.data?.errorCode==='VALIDATION_ERROR' && Array.isArray(error.response.data.errors)) {
    const fields={};for(const item of error.response.data.errors) if(Object.hasOwn(values,item.field)&&typeof item.message==='string') fields[item.field]=item.message
    setErrors(fields)
   }
  } finally {lock.current=false;setPending(false)}
 }
 return <form className="driver-action-panel" ref={form} noValidate onSubmit={submit} aria-busy={pending}><h3>{target==='FAILED' ? 'Mark this delivery as failed?' : actionLabels[target]}</h3>
 {(target==='DELIVERED'||target==='FAILED') && <p className="role-note">{target==='FAILED' ? 'Confirm only if this delivery attempt has failed.' : 'Confirm that the shipment has reached the receiver.'} This ends the current shipment workflow and cannot be undone here.</p>}
 <fieldset className="auth-fields" disabled={pending}><legend className="sr-only">Status confirmation</legend>
 {target==='DELIVERED' && <Field label="Receiver name (required)" name="receiverName" autoFocus required value={values.receiverName} error={errors.receiverName} onChange={event=>setValues({...values,receiverName:event.target.value})}/>}
 {['location','note',...(target==='DELIVERED'?['deliveryNotes']:[])].map(name=><Field key={name} label={name==='location'?'Location (optional)':name==='deliveryNotes'?'Delivery notes (optional)':target==='FAILED'?'Reason / operational note (recommended)':'Operational note (optional)'} name={name} autoFocus={name==='location'&&target!=='DELIVERED'} value={values[name]} error={errors[name]} onChange={event=>setValues({...values,[name]:event.target.value})}/>)}
 <div className="customer-actions"><Button type="submit">{pending?'Saving…':target==='DELIVERED'?'Confirm delivery':target==='FAILED'?'Confirm failed delivery':'Confirm update'}</Button><Button variant="quiet" onClick={onCancel}>Cancel</Button></div></fieldset>
 {message && <p role="alert" className="field-error">{message}</p>}{Object.values(errors).some(Boolean)&&<p role="alert" className="field-error">Please check the highlighted fields.</p>}</form>
}
function DriverHistory({ id }) {
 const state=useDriverData('history','',id)
 return state.loading ? <ShipmentLoading/> : state.error ? <ErrorState title="Could not load shipment history" message={state.error} onRetry={state.refresh}/> : <ShipmentTimeline history={state.data.history || []} status={state.data.currentStatus}/>
}
export function DriverShipmentCard({ shipment, onRefresh, onFeedback }) {
 const [target,setTarget]=useState(null)
 const [expanded,setExpanded]=useState(false)
 const actions=nextActions(shipment.status)
 const actionArea=useRef(null)
 const cancel=()=>{setTarget(null);actionArea.current?.focus()}
 return <article className="shipment-card driver-shipment"><header><span className="shipment-reference">Shipment #{shipment._id.slice(-6).toUpperCase()}</span><StatusBadge status={shipment.status}/></header><RouteVisual pickup={shipment.pickupAddress} destination={shipment.dropAddress}/><p className="driver-weight">{shipment.weight ?? '—'} kg</p>
 <div className="customer-actions" ref={actionArea} tabIndex={-1}>{actions.map(action=><Button key={action} variant={action==='FAILED'?'quiet':'primary'} disabled={Boolean(target)} onClick={()=>setTarget(action)}>{actionLabels[action]}</Button>)}{!actions.length&&<p>{shipment.status==='DELIVERED'?'Delivery completed':shipment.status==='FAILED'?'Delivery failed':'No driver action available'}</p>}</div>
 {target&&<StatusUpdateForm shipment={shipment} target={target} onCancel={cancel} onUpdated={()=>{setTarget(null);onFeedback('Shipment updated successfully.');onRefresh()}} onConflict={message=>{setTarget(null);onFeedback(message);onRefresh()}}/>}
 <Button variant="quiet" className="driver-detail-toggle" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Hide shipment details':'View shipment details'}</Button>
 {expanded&&<div className="detail-side"><p className="full-shipment-id">Shipment #{shipment._id}</p><DriverHistory id={shipment._id}/>{shipment.status==='DELIVERED'&&<DeliveryProofCard proof={shipment.deliveryProof}/>}</div>}</article>
}
export function DriverShipmentList({ shipments, onRefresh, onFeedback, filtered=false }) {
 return shipments.length ? <div className="shipment-grid">{shipments.map(shipment=><DriverShipmentCard key={shipment._id} shipment={shipment} onRefresh={onRefresh} onFeedback={onFeedback}/>)}</div> : <EmptyState title={filtered?'No shipments with this status':'No assigned shipments'} message={filtered?'Choose another status to view your assignments.':'You’re all caught up. Assigned deliveries will appear here.'}/>
}
export function TripCard({ trip }) {
 return <article className="customer-panel"><div className="section-heading"><h2>Trip #{trip._id.slice(-6).toUpperCase()}</h2><StatusBadge status={trip.status}/></div><dl className="shipment-facts"><div><dt>Date</dt><dd>{formatDateTime(trip.date)}</dd></div><div><dt>Vehicle</dt><dd>{trip.vehicleId?.registrationNumber || 'Vehicle unavailable'}{trip.vehicleId?.type&&<small className="vehicle-type">{formatVehicleType(trip.vehicleId.type)}</small>}</dd></div><div><dt>Shipments listed</dt><dd>{trip.shipmentIds?.length || 0}</dd></div></dl><details className="trip-details"><summary>View trip shipments</summary>{trip.shipmentIds?.length ? trip.shipmentIds.map(shipment=><div key={shipment._id} className="trip-shipment"><StatusBadge status={shipment.status}/><RouteVisual pickup={shipment.pickupAddress} destination={shipment.dropAddress}/></div>):<p>No shipment details are available.</p>}</details></article>
}
export function DriverTripsList({ trips }) {return trips.length?<div className="shipment-grid">{trips.map(trip=><TripCard key={trip._id} trip={trip}/>)}</div>:<EmptyState title="No trips" message="No trips are currently assigned."/>}
