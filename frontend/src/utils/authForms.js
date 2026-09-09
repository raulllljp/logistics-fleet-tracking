export function validateAuth(values, registering = false) {
  const errors = {}
  if (registering && (Array.from(values.name.trim()).length < 2 || Array.from(values.name.trim()).length > 100)) errors.name = 'Enter a name between 2 and 100 characters.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.'
  if (!values.password) errors.password = 'Enter your password.'
  else if (registering && Array.from(values.password).length < 8) errors.password = 'Use at least 8 characters.'
  else if (new TextEncoder().encode(values.password).length > 72) errors.password = 'Password is too long (maximum 72 UTF-8 bytes).'
  if (registering && !['customer', 'driver'].includes(values.role)) errors.role = 'Choose Customer or Driver.'
  return errors
}

export function authError(error) {
  const code = error.response?.data?.errorCode
  const messages = {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
    ACCOUNT_INACTIVE: 'This account is inactive.',
    UNAUTHORIZED: 'Your session could not be verified. Please sign in again.',
    VALIDATION_ERROR: 'Please check the highlighted fields and try again.',
  }
  const fields = {}
  if (code === 'EMAIL_ALREADY_EXISTS') fields.email = messages[code]
  if (code === 'VALIDATION_ERROR') {
    const safe = { name: 'Enter a name between 2 and 100 characters.', email: 'Enter a valid email address.', password: 'Check the password requirements below.', role: 'Choose Customer or Driver.' }
    for (const item of Array.isArray(error.response?.data?.errors) ? error.response.data.errors : []) {
      if (Object.hasOwn(safe, item.field)) fields[item.field] = safe[item.field]
    }
  }
  return { fields, message: messages[code] || (error.code === 'ECONNABORTED'
    ? 'The service took too long to respond. Please try again.'
    : error.request && !error.response ? 'Unable to reach the service. Check your connection and try again.'
      : 'We could not complete your request. Please try again.') }
}
