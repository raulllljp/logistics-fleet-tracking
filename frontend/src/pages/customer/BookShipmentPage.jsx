import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createShipment, estimateShipment } from '../../api/shipmentApi'
import { bookingPayload, pricingPayload, validateBooking, shipmentError, bookingErrors } from '../../utils/customerShipments'
import { formatCurrency } from '../../utils/formatters'
import Field from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import ErrorState from '../../components/common/ErrorState'
export default function BookShipmentPage() {
 const [values,setValues]=useState({pickupAddress:'',dropAddress:'',weight:'',distance:''})
 const [errors,setErrors]=useState({})
 const [error,setError]=useState('')
 const [estimate,setEstimate]=useState(null)
 const [pending,setPending]=useState('')
 const busy=useRef(false)
 const form=useRef(null)
 const navigate=useNavigate()
 const change=event=>{
  const {name,value}=event.target
  setValues(current=>({...current,[name]:value}))
  setErrors(current=>({...current,[name]:undefined}))
  setError('')
  if(name==='weight'||name==='distance') setEstimate(null)
 }
 const run=async action=>{
  if(busy.current) return
  const invalid=validateBooking(values,action==='estimate')
  setErrors(invalid);setError('')
  if(Object.keys(invalid).length){form.current.elements.namedItem(Object.keys(invalid)[0])?.focus();return}
  busy.current=true;setPending(action)
  try {
   if(action==='estimate') {
    setEstimate(null)
    const response=await estimateShipment(pricingPayload(values))
    setEstimate(response.data.estimatedCost)
   } else {
    const response=await createShipment(bookingPayload(values))
    const id=response.data?.shipment?._id
    navigate(id ? '/customer/shipments/'+encodeURIComponent(id) : '/customer/shipments',{replace:true,state:{booked:true}})
   }
  } catch(problem){setError(shipmentError(problem));setErrors(bookingErrors(problem))}
  finally {busy.current=false;setPending('')}
 }
 return <div className="page-stack booking-page"><header><p className="eyebrow">A NEW DELIVERY</p><h1>Book a shipment</h1><p className="page-description">Tell us where it starts, where it’s going, and what you’re sending.</p></header>
 <form ref={form} noValidate onSubmit={event=>{event.preventDefault();void run('book')}} aria-busy={Boolean(pending)}>
 <fieldset className="booking-fields" disabled={Boolean(pending)}><legend className="sr-only">Shipment details</legend>
 <section className="customer-panel"><h2>01 / Pickup & destination</h2><div className="booking-inputs"><Field label="Pickup address" name="pickupAddress" autoComplete="off" required value={values.pickupAddress} onChange={change} error={errors.pickupAddress}/><Field label="Destination address" name="dropAddress" autoComplete="off" required value={values.dropAddress} onChange={change} error={errors.dropAddress}/></div></section>
 <section className="customer-panel"><h2>02 / Shipment & estimate</h2><div className="booking-inputs numeric-fields"><Field label="Weight (kg)" name="weight" type="number" step="any" min="0" required value={values.weight} onChange={change} error={errors.weight}/><Field label="Distance (km)" name="distance" type="number" step="any" min="0" required value={values.distance} onChange={change} error={errors.distance}/></div><p className="role-note">Enter the delivery distance. Addresses do not calculate it automatically.</p><div className="estimate-row"><Button variant="quiet" onClick={()=>run('estimate')}>{pending==='estimate' ? 'Estimating…' : 'Estimate price'}</Button><div aria-live="polite"><span className="estimate-label">Estimated delivery cost</span><strong className="estimate-price">{estimate===null ? 'Get an estimate' : formatCurrency(estimate)}</strong></div></div><p className="role-note">Estimate only. No payment is collected here. Booking calculates the cost again.</p></section>
 <Button type="submit" disabled={Boolean(pending)}>{pending==='book' ? 'Booking shipment…' : 'Book shipment'}</Button></fieldset>
 <p className="sr-only" role="status">{pending ? 'Please wait. Your request is in progress.' : ''}</p>
 {Object.keys(errors).some(key=>errors[key]) && <p role="alert" className="field-error">Please check the highlighted fields.</p>}
 {error && <ErrorState title="Could not complete your request" message={error}/>}
 </form></div>
}
