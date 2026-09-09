import {useEffect,useState} from 'react'
import {vehicles,drivers,shipments,trips,reports,operationsError} from '../utils/operations.js'
export const refreshOperations=scopes=>window.dispatchEvent(new CustomEvent('operations:refresh',{detail:{scopes}}))
export function useOperations(kind,params={}) {
 const [version,setVersion]=useState(0)
 const query=JSON.stringify(params)
 const key=kind+query+version
 const [state,setState]=useState({})
 useEffect(()=>{const refresh=event=>{const scopes=event.detail?.scopes;if(!scopes||scopes.includes(kind))setVersion(v=>v+1)};window.addEventListener('operations:refresh',refresh);return()=>window.removeEventListener('operations:refresh',refresh)},[kind])
 useEffect(()=>{
 const controller=new AbortController();const options={signal:controller.signal};const filters=JSON.parse(query)
 const requests={vehicles:()=>vehicles.getVehicles(filters,options),drivers:()=>drivers.getDrivers(filters,options),available:()=>drivers.getAvailableDrivers(options),shipments:()=>shipments.getAllShipments(filters,options),trips:()=>trips.getTrips(filters,options),history:()=>shipments.getShipmentHistory(filters.id,options),fleet:()=>reports.getFleetUtilization(options),workload:()=>reports.getDriverWorkload(options),summary:()=>reports.getShipmentSummary(filters,options),performance:()=>reports.getDeliveryPerformance(filters,options),tripReport:()=>reports.getTripSummary(filters,options)}
 requests[kind]().then(response=>{if(!controller.signal.aborted)setState({key,data:response.data})}).catch(error=>{if(!controller.signal.aborted)setState({key,error:operationsError(error)})})
 return()=>controller.abort()
 },[kind,query,key])
 return {loading:state.key!==key,data:state.key===key?state.data:null,error:state.key===key?state.error:null,refresh:()=>setVersion(v=>v+1)}
}
