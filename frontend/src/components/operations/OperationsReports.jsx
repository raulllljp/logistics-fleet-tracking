import {useOperations} from '../../hooks/useOperations'
import {LoadState,StatCard,OperationsHeader} from './OperationsUI'
import EmptyState from '../common/EmptyState'
import {ShipmentsManager} from './ShipmentManagement'
import {Link} from 'react-router-dom'
const label=value=>value.replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ').replace(/^./,c=>c.toUpperCase())
export function ReportSection({kind,title}) {
 const state=useOperations(kind)
 const metrics=[]
 for(const [key,value] of Object.entries(state.data||{})) {
 if(typeof value==='number')metrics.push([key,value])
 else if(value&&typeof value==='object')for(const [name,count] of Object.entries(value))if(typeof count==='number')metrics.push([name,count])
 }
 const empty=state.data&&(!metrics.length||(['fleet','workload','summary','tripReport'].includes(kind)&&metrics.some(([key])=>key.startsWith('total'))&&metrics.filter(([key])=>key.startsWith('total')).every(([,value])=>value===0)))
 return <section><div className="section-heading"><h2>{title}</h2><button className="button button-quiet" disabled={state.loading} onClick={state.refresh}>Refresh</button></div><LoadState state={state}>{empty?<EmptyState title={'No '+title.toLowerCase()+' data available yet.'} message="Operational summaries will appear here when records exist."/>:<div className="operations-stats">{metrics.map(([key,value])=><StatCard key={key} label={key==='busyDrivers'?'Paused drivers':label(key)} value={key.toLowerCase().includes('percentage')?value+'%':value} supportingText={key==='busyDrivers'?'Unavailable flag, not active workload':undefined}/>)}</div>}</LoadState></section>
}
export function ReportsView() {return <div className="page-stack"><header><p className="eyebrow">OPERATIONS WORKSPACE</p><h1>Reports</h1><p className="page-description">Current backend summaries. Detailed visualizations will follow.</p></header>{[['fleet','Fleet utilization'],['workload','Driver workload'],['summary','Shipment summary'],['performance','Delivery performance'],['tripReport','Trip summary']].map(([kind,title])=><ReportSection key={kind} kind={kind} title={title}/>)}</div>}
export function Overview() {
 const state=useOperations('summary')
 return <div className="page-stack"><OperationsHeader title="Operations overview" state={state}/><LoadState state={state}>{state.data?.totalShipments===0?<EmptyState title="No shipment data available yet." message="Shipment metrics will appear here when bookings exist."/>:<div className="operations-stats">{[['Total shipments',state.data?.totalShipments],['Awaiting dispatch',state.data?.pendingShipments],['Active shipments',state.data?.activeShipments],['Delivered',state.data?.byStatus?.DELIVERED],['Failed',state.data?.byStatus?.FAILED]].map(([title,value])=><StatCard key={title} label={title} value={value}/>)}</div>}</LoadState><ReportSection kind="fleet" title="Fleet readiness"/><ReportSection kind="workload" title="Driver availability"/><ShipmentsManager pendingOnly/><Link className="text-action" to="/operations/shipments">View all shipments →</Link><div className="customer-actions"><Link className="button button-quiet" to="/operations/vehicles">Manage vehicles</Link><Link className="button button-quiet" to="/operations/drivers">Manage drivers</Link></div></div>
}
