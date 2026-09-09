import { request, resourceId } from './client.js'

// Return the complete API v1 JSON envelope, including root count/message.
export const createVehicle = (payload) => request('post', "/vehicles", payload)
export const getVehicles = (params, options) => request('get', "/vehicles", undefined, params, options)
export const getVehicle = (id, options) => request('get', "/vehicles/" + resourceId(id) + "", undefined, undefined, options)
export const updateVehicle = (id, payload) => request('put', "/vehicles/" + resourceId(id) + "", payload)
export const deactivateVehicle = (id) => request('delete', "/vehicles/" + resourceId(id) + "", undefined)
