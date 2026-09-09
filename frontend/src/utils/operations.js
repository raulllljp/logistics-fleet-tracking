import * as vehicles from '../api/vehicleApi.js'
import * as drivers from '../api/driverApi.js'
import * as shipments from '../api/shipmentApi.js'
import * as trips from '../api/tripApi.js'
import * as reports from '../api/reportApi.js'
export {vehicles,drivers,shipments,trips,reports}
export const refId=value=>typeof value==='object'?value?._id:value
export const dispatchPayload=driver=>({driverId:driver._id,vehicleId:refId(driver.vehicleId)})
export const vehiclePayload=values=>({registrationNumber:values.registrationNumber.trim(),type:values.type,capacity:Number(values.capacity),status:values.status})
export const driverPayload=(values,editing)=>editing?{licenseNumber:values.licenseNumber.trim(),phone:values.phone.trim(),isAvailable:values.isAvailable==='true'}:{userId:values.userId.trim(),licenseNumber:values.licenseNumber.trim(),phone:values.phone.trim()}
export const tripPayload=values=>({driverId:values.driverId,vehicleId:values.vehicleId,shipmentIds:values.shipmentIds,...(values.date?{date:values.date}:{})})
export const tripActions=status=>({planned:['active','cancelled'],active:['completed','cancelled']})[status]||[]
export const operationRefreshScopes=Object.freeze({dispatch:['shipments','available','vehicles','summary','fleet'],vehicle:['vehicles','fleet'],driver:['drivers','available','vehicles','workload'],trip:['trips','shipments','summary','tripReport']})
export const eligibleShipments=(items,driver,liveTrips=[])=>{
 const occupied=new Set(liveTrips.filter(t=>['planned','active'].includes(t.status)).flatMap(t=>t.shipmentIds.map(refId)))
 return items.filter(s=>['ASSIGNED','PICKED_UP','IN_TRANSIT'].includes(s.status)&&refId(s.assignedDriverId)===driver?._id&&refId(s.assignedVehicleId)===refId(driver?.vehicleId)&&!occupied.has(s._id))
}
export const shipmentExclusionReason=(shipment,driver,liveTrips=[])=>{
 if(!['ASSIGNED','PICKED_UP','IN_TRANSIT'].includes(shipment.status))return 'Shipment status is not eligible for trip grouping.'
 if(liveTrips.some(trip=>['planned','active'].includes(trip.status)&&trip.shipmentIds.some(id=>refId(id)===shipment._id)))return 'Already part of a planned or active trip.'
 if(refId(shipment.assignedDriverId)!==driver?._id)return 'Assigned to another driver.'
 if(refId(shipment.assignedVehicleId)!==refId(driver?.vehicleId))return 'Assigned to another vehicle.'
 return ''
}
export const shipmentOptions=(items,driver,liveTrips=[])=>items.map(shipment=>({shipment,reason:shipmentExclusionReason(shipment,driver,liveTrips)}))
export function operationsError(error) {
 const code=error.response?.data?.errorCode
 const explicitMessages={SHIPMENT_NOT_FOUND:'This shipment could not be found. It may have been removed or changed.',DRIVER_PROFILE_NOT_FOUND:'The selected driver profile could not be found.',VEHICLE_NOT_FOUND:'The selected vehicle could not be found.'}
 const messages={VEHICLE_CAPACITY_EXCEEDED:'The vehicle has insufficient remaining capacity. Choose another pair or wait for deliveries to finish.',DRIVER_VEHICLE_MISMATCH:'The driver and vehicle must be linked consistently. Refresh and check their linkage.',SHIPMENT_NOT_BOOKABLE:'Only booked shipments can be dispatched.',SHIPMENT_ALREADY_ASSIGNED:'This shipment has already been assigned. Refresh the list.',DRIVER_UNAVAILABLE:'This driver is unavailable for more work.',DRIVER_ACCOUNT_INACTIVE:'The driver account is inactive.',VEHICLE_MAINTENANCE:'This vehicle is in maintenance.',VEHICLE_INACTIVE:'This vehicle is inactive.',VEHICLE_UNAVAILABLE:'This vehicle is unavailable. Check its linkage and active work.',VEHICLE_ASSIGNED:'Active shipment work prevents this change.',VEHICLE_HAS_DRIVER:'Unlink the driver before deactivating this vehicle.',VEHICLE_CONFLICT:'This vehicle changed. Refresh and try again.',INVALID_STATUS_TRANSITION:'This status change is not allowed.',INVALID_TRIP_STATUS_TRANSITION:'This trip status change is not allowed.',TRIP_HAS_ACTIVE_SHIPMENTS:'This trip cannot be completed until all shipments are delivered or failed.',SHIPMENT_ALREADY_IN_TRIP:'A selected shipment already belongs to a planned or active trip.',SHIPMENT_ASSIGNMENT_MISMATCH:'All shipments must be assigned to the selected driver and vehicle.',SHIPMENT_NOT_ELIGIBLE_FOR_TRIP:'Only active assigned shipments can be grouped.',USER_NOT_DRIVER:'The selected user must have a driver account.',DRIVER_PROFILE_ALREADY_EXISTS:'This user already has a driver profile.',LICENSE_ALREADY_EXISTS:'This license is already registered.',VEHICLE_ALREADY_EXISTS:'This registration number is already registered.',DRIVER_ALREADY_HAS_VEHICLE:'Unlink the current vehicle before linking another.',VEHICLE_ALREADY_LINKED:'This vehicle is already linked to a driver.',DRIVER_HAS_NO_VEHICLE:'This driver has no linked vehicle.',VALIDATION_ERROR:'Check the highlighted fields and try again.',FORBIDDEN:'Your account does not have permission for this action.',UNAUTHORIZED:'Please sign in again.'}
 if(explicitMessages[code])return explicitMessages[code]
 if(messages[code])return messages[code]
 if(error.response?.status===404)return 'The requested resource no longer exists. Refresh the list.'
 if(error.response?.status===409)return 'The records have changed or conflict with current work. Refresh before retrying.'
 return 'The service could not complete this request. Please try again.'
}
