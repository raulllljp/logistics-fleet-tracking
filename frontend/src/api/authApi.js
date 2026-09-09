import { request } from './client.js'

// Return the complete API v1 JSON envelope, including root count/message.
export const register = (payload) => request('post', "/auth/register", payload, undefined, { skipAuth: true })
export const login = (payload) => request('post', "/auth/login", payload, undefined, { skipAuth: true })
export const getMe = (options) => request('get', "/auth/me", undefined, undefined, options)
