import { useEffect, useState } from 'react'
import { getMyDriverProfile } from '../api/driverApi'
import { getDriverShipments, getShipmentHistory } from '../api/shipmentApi'
import { getMyTrips } from '../api/tripApi'
import { driverError } from '../utils/driverWorkflow'
export function useDriverData(kind, status = '', id) {
  const [version, setVersion] = useState(0)
  const key = `${kind}:${status}:${id || ''}:${version}`
  const [result, setResult] = useState({})
  useEffect(() => {
    const controller = new AbortController()
    const options = { signal: controller.signal }
    const request = kind === 'profile' ? getMyDriverProfile(options) : kind === 'trips' ? getMyTrips(status ? { status } : undefined, options) : kind === 'history' ? getShipmentHistory(id, options) : getDriverShipments(status ? { status } : undefined, options)
    request.then(response => { if (!controller.signal.aborted) setResult({ key, data: response.data }) })
      .catch(error => { if (!controller.signal.aborted) setResult({ key, error: driverError(error) }) })
    return () => controller.abort()
  }, [kind, status, id, key])
  return { loading: result.key !== key, data: result.key === key ? result.data : null, error: result.key === key ? result.error : null, refresh: () => setVersion(value => value + 1) }
}
