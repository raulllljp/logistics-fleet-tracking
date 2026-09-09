import { request, resourceId } from './client.js'

// Return the complete API v1 JSON envelope, including root count/message.
export const estimateShipment = (payload) => request('post', "/shipments/estimate", payload)
export const createShipment = (payload) => request('post', "/shipments", payload)
export const getMyShipments = (params, options) => request('get', "/shipments/my", undefined, params, options)
export const getDriverShipments = (params, options) => request('get', "/shipments/driver/my", undefined, params, options)
export const getAllShipments = (params, options) => request('get', "/shipments", undefined, params, options)
export const assignShipment = (id, payload) => request('put', "/shipments/" + resourceId(id) + "/assign", payload)
export const updateShipmentStatus = (id, payload) => request('put', "/shipments/" + resourceId(id) + "/status", payload)
export const getShipmentHistory = (id, options) => request('get', "/shipments/" + resourceId(id) + "/history", undefined, undefined, options)
export const trackShipment = (id, options) => request('get', "/shipments/" + resourceId(id) + "/track", undefined, undefined, options)
export const getDeliveryProof = (id, options) => request('get', "/shipments/" + resourceId(id) + "/proof", undefined, undefined, options)
export const getShipmentById = (id, options) => request('get', "/shipments/" + resourceId(id) + "", undefined, undefined, options)
