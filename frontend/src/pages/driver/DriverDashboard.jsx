import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDriverData } from '../../hooks/useDriverData'
import { DriverProfileCard, DriverShipmentList, DriverTripsList } from '../../components/driver/DriverComponents'
import { ShipmentLoading } from '../../components/common/ShipmentComponents'
import ErrorState from '../../components/common/ErrorState'
export default function DriverDashboard() {
 const profile=useDriverData('profile')
 const shipments=useDriverData('shipments')
 const trips=useDriverData('trips')
 const [feedback,setFeedback]=useState('')
 const priority=['IN_TRANSIT','PICKED_UP','ASSIGNED']
 const active=(shipments.data?.shipments||[]).filter(item=>priority.includes(item.status)).sort((a,b)=>priority.indexOf(a.status)-priority.indexOf(b.status)).slice(0,3)
 const refresh=()=>{shipments.refresh();profile.refresh();trips.refresh()}
 return <div className="page-stack"><header><p className="eyebrow">READY FOR THE NEXT STOP</p><h1>Driver dashboard</h1><p className="page-description">Your vehicle, your assignments, and your next action.</p></header>{profile.loading?<ShipmentLoading/>:profile.error?<ErrorState title="Could not load driver profile" message={profile.error} onRetry={profile.refresh}/>:<DriverProfileCard driver={profile.data.driver}/>}
 <section><div className="section-heading"><h2>Next deliveries</h2><Link className="text-action" to="/driver/shipments">All assignments ?</Link></div>{feedback&&<p role="status" className="booking-success">{feedback}</p>}{shipments.loading?<ShipmentLoading/>:shipments.error?<ErrorState title="Could not load assigned shipments" message={shipments.error} onRetry={shipments.refresh}/>:<DriverShipmentList shipments={active} onRefresh={refresh} onFeedback={setFeedback}/>}</section>
 <section><div className="section-heading"><h2>Current & planned trips</h2><Link className="text-action" to="/driver/trips">All trips ?</Link></div>{trips.loading?<ShipmentLoading/>:trips.error?<ErrorState title="Could not load trips" message={trips.error} onRetry={trips.refresh}/>:<DriverTripsList trips={(trips.data.trips||[]).filter(trip=>['active','planned'].includes(trip.status))}/>}</section></div>
}
