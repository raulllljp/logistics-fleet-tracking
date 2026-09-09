import { request } from './client.js'

// Return the complete API v1 JSON envelope, including root count/message.
export const getFleetUtilization = (options) => request('get', "/admin/reports/fleet-utilization", undefined, undefined, options)
export const getDriverWorkload = (options) => request('get', "/admin/reports/driver-workload", undefined, undefined, options)
export const getShipmentSummary = (params, options) => request('get', "/admin/reports/shipments", undefined, params, options)
export const getDeliveryPerformance = (params, options) => request('get', "/admin/reports/delivery-performance", undefined, params, options)
export const getTripSummary = (params, options) => request('get', "/admin/reports/trips", undefined, params, options)
