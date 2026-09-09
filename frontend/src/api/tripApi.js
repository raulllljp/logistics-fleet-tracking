import { request, resourceId } from './client.js'

// Return the complete API v1 JSON envelope, including root count/message.
export const createTrip = (payload) => request('post', "/trips", payload)
export const getTrips = (params, options) => request('get', "/trips", undefined, params, options)
export const getMyTrips = (params, options) => request('get', "/trips/my", undefined, params, options)
export const getTrip = (id, options) => request('get', "/trips/" + resourceId(id) + "", undefined, undefined, options)
export const updateTripStatus = (id, payload) => request('put', "/trips/" + resourceId(id) + "/status", payload)
