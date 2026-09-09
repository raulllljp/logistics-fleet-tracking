export const nextActions = status => ({ ASSIGNED: ['PICKED_UP'], PICKED_UP: ['IN_TRANSIT'], IN_TRANSIT: ['DELIVERED', 'FAILED'] })[status] || []
export const actionLabels = { PICKED_UP: 'Mark picked up', IN_TRANSIT: 'Start transit', DELIVERED: 'Mark delivered', FAILED: 'Mark failed' }
export function statusPayload(status, values) {
  const payload = { status }
  for (const key of ['location', 'note', ...(status === 'DELIVERED' ? ['receiverName', 'deliveryNotes'] : [])]) {
    if (values[key]?.trim()) payload[key] = values[key].trim()
  }
  return payload
}
export function validateStatus(status, values) {
  const errors = {}
  if (status === 'DELIVERED' && (Array.from(values.receiverName.trim()).length < 2 || Array.from(values.receiverName.trim()).length > 100)) errors.receiverName = 'Enter a receiver name between 2 and 100 characters.'
  for (const [key, max] of [['location', 200], ['note', 1000], ...(status === 'DELIVERED' ? [['deliveryNotes', 1000]] : [])]) {
    if (Array.from(values[key]?.trim() || '').length > max) errors[key] = `Use no more than ${max} characters.`
  }
  return errors
}
export function driverError(error) {
  const code = error.response?.data?.errorCode
  return ({ DRIVER_PROFILE_NOT_FOUND: 'Your driver profile is not set up yet. Contact your operations team.', INVALID_STATUS_TRANSITION: 'This shipment has changed. Refresh its current status before continuing.', SHIPMENT_NOT_ASSIGNED_TO_DRIVER: 'This shipment is no longer assigned to you.', SHIPMENT_NOT_FOUND: 'This shipment could not be found.', VALIDATION_ERROR: 'Please check the form details and try again.', DELIVERY_RECEIVER_REQUIRED: 'Enter the name of the person receiving this delivery.', DELIVERY_PROOF_NOT_FOUND: 'Delivery proof is not available for this shipment.', FORBIDDEN: 'Your account does not have access to this information.', UNAUTHORIZED: 'Please sign in again.', ASSIGNED_VEHICLE_NOT_FOUND: 'The assigned vehicle is unavailable. Contact operations.' })[code] || 'We could not complete this request. Please try again.'
}
