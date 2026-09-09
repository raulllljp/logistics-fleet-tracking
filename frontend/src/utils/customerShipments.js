export const activeStatuses = ['BOOKED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
export const pricingPayload = values => ({ weight: Number(values.weight), distance: Number(values.distance) })
export const bookingPayload = values => ({ pickupAddress: values.pickupAddress.trim(), dropAddress: values.dropAddress.trim(), ...pricingPayload(values) })
export function validateBooking(values, estimateOnly = false) {
  const errors = {}
  if (!estimateOnly) for (const field of ['pickupAddress', 'dropAddress']) {
    const length = Array.from(values[field].trim()).length
    if (length < 5 || length > 500) errors[field] = 'Enter an address between 5 and 500 characters.'
  }
  if (String(values.weight).trim() === '' || !Number.isFinite(Number(values.weight)) || Number(values.weight) <= 0) errors.weight = 'Weight must be greater than zero.'
  if (String(values.distance).trim() === '' || !Number.isFinite(Number(values.distance)) || Number(values.distance) < 0) errors.distance = 'Enter a distance of zero or more.'
  return errors
}
export function shipmentError(error) {
  const code = error.response?.data?.errorCode
  const messages = { SHIPMENT_NOT_FOUND: 'This shipment could not be found.', INVALID_SHIPMENT_ID: 'This shipment link is invalid.', FORBIDDEN: 'Your account does not have access to this shipment.', UNAUTHORIZED: 'Please sign in again to continue.', INVALID_PRICING_INPUT: 'Check the weight and distance and try again.', VALIDATION_ERROR: 'Please check your details and try again.' }
  return messages[code] || (error.response?.status === 403 ? messages.FORBIDDEN : 'We could not reach your shipment information. Please try again.')
}
export function bookingErrors(error) {
  const fields = {}
  if (error.response?.data?.errorCode === 'VALIDATION_ERROR' && Array.isArray(error.response.data.errors)) {
    for (const item of error.response.data.errors) if (['pickupAddress', 'dropAddress', 'weight', 'distance'].includes(item.field) && typeof item.message === 'string') fields[item.field] = item.message
  }
  return fields
}
export const shipmentFilter = status => status ? { status } : undefined
