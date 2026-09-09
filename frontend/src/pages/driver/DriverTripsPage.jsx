import { useDriverData } from '../../hooks/useDriverData'
import { DriverTripsList } from '../../components/driver/DriverComponents'
import { ShipmentLoading } from '../../components/common/ShipmentComponents'
import ErrorState from '../../components/common/ErrorState'
import Button from '../../components/ui/Button'
export default function DriverTripsPage() {
 const state=useDriverData('trips')
 return <div className="page-stack"><header className="customer-header"><div><p className="eyebrow">YOUR TRIP PLAN</p><h1>My trips</h1><p className="page-description">Your assigned trips and shipment details. Operations manages trip status.</p></div><Button variant="quiet" disabled={state.loading} onClick={state.refresh}>Refresh trips</Button></header>{state.loading?<ShipmentLoading/>:state.error?<ErrorState title="Could not load trips" message={state.error} onRetry={state.refresh}/>:<DriverTripsList trips={state.data.trips||[]}/>}</div>
}
