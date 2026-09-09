import test from 'node:test'
import assert from 'node:assert/strict'
import { validateAuth, authError } from '../src/utils/authForms.js'

test('auth validation follows public roles and contract password boundaries', () => {
  const values = { name: 'Example Name', email: 'name@example.invalid', password: 'abcdefgh', role: 'customer' }
  assert.deepEqual(validateAuth(values, true), {})
  assert.deepEqual(validateAuth({ ...values, role: 'driver' }, true), {})
  for (const role of ['admin', 'dispatcher', '']) assert.ok(validateAuth({ ...values, role }, true).role)
  assert.ok(validateAuth({ ...values, name: ' ' }, true).name)
  assert.ok(validateAuth({ ...values, email: 'invalid' }).email)
  assert.ok(validateAuth({ ...values, password: '1234567' }, true).password)
  assert.deepEqual(validateAuth({ ...values, password: 'x' }), {})
  assert.ok(validateAuth({ ...values, password: '' }).password)
  assert.deepEqual(validateAuth({ ...values, password: 'é'.repeat(36) }, true), {})
  assert.ok(validateAuth({ ...values, password: 'é'.repeat(37) }, true).password)
})

test('auth errors provide safe messages and field feedback without backend internals', () => {
  for (const [code, message] of [['INVALID_CREDENTIALS', 'Invalid email or password.'],
    ['EMAIL_ALREADY_EXISTS', 'An account with this email already exists.'], ['ACCOUNT_INACTIVE', 'This account is inactive.']]) {
    assert.equal(authError({ response: { data: { errorCode: code } } }).message, message)
  }
  const feedback = authError({ response: { data: { errorCode: 'VALIDATION_ERROR', errors: [{ field: 'email', message: 'private database details' }] } } })
  assert.equal(feedback.fields.email, 'Enter a valid email address.')
  assert.ok(!JSON.stringify(feedback).includes('private'))
  assert.equal(authError({ message: 'MongoDB private details', response: { status: 500, data: { message: 'private' } } }).message, 'We could not complete your request. Please try again.')
  assert.match(authError({ request: {} }).message, /connection/)
  assert.match(authError({ code: 'ECONNABORTED' }).message, /too long/)
})
