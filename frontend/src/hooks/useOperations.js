import { useEffect, useState } from 'react'
import {
  vehicles,
  drivers,
  shipments,
  trips,
  reports,
  operationsError,
} from '../utils/operations.js'

export const refreshOperations = scopes =>
  window.dispatchEvent(
    new CustomEvent('operations:refresh', { detail: { scopes } })
  )

export function useOperations(kind, params = {}) {
  const [version, setVersion] = useState(0)
  const query = JSON.stringify(params)
  const key = `${kind}:${query}:${version}`
  const [state, setState] = useState({
    key: null,
    kind: null,
    query: null,
    data: null,
    error: null,
  })

  useEffect(() => {
    const refresh = event => {
      const scopes = event.detail?.scopes
      if (!scopes || scopes.includes(kind)) setVersion(v => v + 1)
    }
    window.addEventListener('operations:refresh', refresh)
    return () => window.removeEventListener('operations:refresh', refresh)
  }, [kind])

  useEffect(() => {
    const controller = new AbortController()
    const options = { signal: controller.signal }
    const filters = JSON.parse(query)
    const requests = {
      vehicles: () => vehicles.getVehicles(filters, options),
      drivers: () => drivers.getDrivers(filters, options),
      available: () => drivers.getAvailableDrivers(options),
      shipments: () => shipments.getAllShipments(filters, options),
      trips: () => trips.getTrips(filters, options),
      history: () => shipments.getShipmentHistory(filters.id, options),
      fleet: () => reports.getFleetUtilization(options),
      workload: () => reports.getDriverWorkload(options),
      summary: () => reports.getShipmentSummary(filters, options),
      performance: () => reports.getDeliveryPerformance(filters, options),
      tripReport: () => reports.getTripSummary(filters, options),
    }

    if (!requests[kind]) return

    requests[kind]()
      .then(response => {
        if (!controller.signal.aborted) {
          setState({ key, kind, query, data: response.data, error: null })
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setState(prev => ({
            key,
            kind,
            query,
            data: prev.kind === kind && prev.query === query ? prev.data : null,
            error: operationsError(error),
          }))
        }
      })

    return () => controller.abort()
  }, [kind, query, key])

  const isCurrent = state.kind === kind && state.query === query
  const isFresh = state.key === key
  const activeData = isCurrent ? state.data : null
  const activeError = isCurrent && isFresh ? state.error : null

  return {
    loading: !activeData && !isFresh,
    refreshing: Boolean(activeData) && !isFresh,
    data: activeData,
    error: activeError,
    refresh: () => setVersion(v => v + 1),
  }
}
