import { useEffect, useState } from 'react'
import { getMyShipments, trackShipment } from '../api/shipmentApi'
import { shipmentError, shipmentFilter } from '../utils/customerShipments'

// Each request owns its result; changing a filter/id invalidates older responses.
export function useCustomerShipments({ id, status = '' } = {}) {
  const [attempt, setAttempt] = useState(0)
  const key = `${id || 'list'}:${status}:${attempt}`
  const [state, setState] = useState({ key: null, data: null, error: null })
  useEffect(() => {
    const controller = new AbortController()
    const request = id ? trackShipment(id, { signal: controller.signal }) : getMyShipments(shipmentFilter(status), { signal: controller.signal })
    request.then(response => { if (!controller.signal.aborted) setState({ key, data: response.data, error: null }) })
      .catch(error => { if (!controller.signal.aborted) setState({ key, data: null, error: shipmentError(error) }) })
    return () => controller.abort()
  }, [id, status, key])
  return { data: state.key === key ? state.data : null, error: state.key === key ? state.error : null,
    loading: state.key !== key, refresh: () => setAttempt(value => value + 1) }
}
