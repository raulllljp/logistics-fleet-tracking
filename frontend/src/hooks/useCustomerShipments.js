import { useEffect, useState } from 'react'
import { getMyShipments, trackShipment } from '../api/shipmentApi'
import { shipmentError, shipmentFilter } from '../utils/customerShipments'

// Preserves existing data during background refreshes to prevent UI flashing
export function useCustomerShipments({ id, status = '' } = {}) {
  const [attempt, setAttempt] = useState(0)
  const query = `${id || 'list'}:${status}`
  const key = `${query}:${attempt}`
  const [state, setState] = useState({ key: null, query: null, data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    const request = id
      ? trackShipment(id, { signal: controller.signal })
      : getMyShipments(shipmentFilter(status), { signal: controller.signal })

    request
      .then(response => {
        if (!controller.signal.aborted) {
          setState({ key, query, data: response.data, error: null })
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setState(prev => ({
            key,
            query,
            data: prev.query === query ? prev.data : null,
            error: shipmentError(error),
          }))
        }
      })

    return () => controller.abort()
  }, [id, status, key, query])

  const isCurrentQuery = state.query === query
  const isFresh = state.key === key
  const activeData = isCurrentQuery ? state.data : null
  const activeError = isCurrentQuery && isFresh ? state.error : null

  return {
    data: activeData,
    error: activeError,
    loading: !activeData && !isFresh,
    refreshing: Boolean(activeData) && !isFresh,
    refresh: () => setAttempt(value => value + 1),
  }
}
