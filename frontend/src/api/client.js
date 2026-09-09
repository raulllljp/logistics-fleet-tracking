import axios from 'axios'
import { clearAuthStorage, getToken } from '../utils/storage.js'
export const client = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})
client.interceptors.request.use((config) => {
  const token = config.skipAuth ? null : getToken()
  if (token) config.headers.set('Authorization', 'Bearer ' + token)
  config.sessionToken = token
  return config
})
client.interceptors.response.use((response) => response, (error) => {
  // A late 401 for an old session must not log out a newly signed-in session.
  // Login/register failures stay local to their form; 403 is never global logout.
  if (error.response?.status === 401 && !error.config?.skipAuth &&
      error.config?.sessionToken && error.config.sessionToken === getToken()) clearAuthStorage()
  return Promise.reject(error)
})
export const request = (method, url, data, params, options = {}) =>
  client.request({ ...options, method, url, data, params }).then((response) => response.data)
export const resourceId = (id) => encodeURIComponent(String(id))
export const getErrorMessage = (error) => error.response?.data?.message ||
  (error.code === 'ECONNABORTED' ? 'The request took too long. Please try again.' :
    error.request ? 'Unable to reach the service. Check your connection and try again.' :
      error.message || 'Something went wrong. Please try again.')
