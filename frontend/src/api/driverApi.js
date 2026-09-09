import { request, resourceId } from './client.js'

// Return the complete API v1 JSON envelope, including root count/message.
export const createDriver = (payload) => request('post', "/drivers", payload)
export const getDrivers = (params, options) => request('get', "/drivers", undefined, params, options)
export const getAvailableDrivers = (options) => request('get', "/drivers/available", undefined, undefined, options)
export const getMyDriverProfile = (options) => request('get', "/drivers/me/profile", undefined, undefined, options)
export const getDriver = (id, options) => request('get', "/drivers/" + resourceId(id) + "", undefined, undefined, options)
export const updateDriver = (id, payload) => request('put', "/drivers/" + resourceId(id) + "", payload)
export const assignVehicle = (id, payload) => request('put', "/drivers/" + resourceId(id) + "/vehicle", payload)
export const unassignVehicle = (id) => request('delete', "/drivers/" + resourceId(id) + "/vehicle", undefined)
