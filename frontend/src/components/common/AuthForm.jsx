import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { authError, validateAuth } from '../../utils/authForms'
import Field from '../ui/Field'
import PasswordField from '../ui/PasswordField'
import Button from '../ui/Button'

export function AuthFeedback({ message }) {
  return message ? <div className="auth-feedback" role="alert" tabIndex={-1}>{message}</div> : null
}

export default function AuthForm({ registering = false }) {
  const auth = useAuth()
  const [values, setValues] = useState({ name: '', email: '', password: '', role: 'customer' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const form = useRef(null)
  const change = (event) => {
    const { name, value } = event.target
    setValues(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: undefined }))
    setMessage('')
  }
  const submit = async (event) => {
    event.preventDefault()
    if (busy.current) return
    const invalid = validateAuth(values, registering)
    setErrors(invalid)
    if (Object.keys(invalid).length) {
      setMessage('Please check the highlighted fields.')
      form.current.elements.namedItem(Object.keys(invalid)[0])?.focus()
      return
    }
    busy.current = true
    setPending(true)
    setMessage('')
    const payload = { email: values.email.trim(), password: values.password }
    if (registering) Object.assign(payload, { name: values.name.trim(), role: values.role })
    try {
      // PublicOnly redirects using the backend user stored by AuthContext.
      await (registering ? auth.register(payload) : auth.login(payload))
    } catch (error) {
      const feedback = authError(error)
      setErrors(feedback.fields)
      setMessage(feedback.message)
    } finally { busy.current = false; setPending(false) }
  }
  return <section className="auth-card">
    <p className="eyebrow">{registering ? 'MAKE YOUR NEXT MOVE' : 'YOUR DELIVERY WORKSPACE'}</p>
    <h1>{registering ? 'Start your journey.' : 'Welcome back.'}</h1>
    <p className="page-description">{registering ? 'Create your account and find your place in the delivery journey.' : 'Sign in to keep your deliveries moving.'}</p>
    <form ref={form} className="auth-form" noValidate onSubmit={submit} aria-busy={pending}>
      <AuthFeedback message={message} />
      <fieldset disabled={pending} className="auth-fields">
        <legend className="sr-only">{registering ? 'Create an account' : 'Sign in'}</legend>
        {registering && <Field label="Full name" name="name" autoComplete="name" required value={values.name} onChange={change} error={errors.name} />}
        <Field label="Email address" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={values.email} onChange={change} error={errors.email} />
        <PasswordField name="password" autoComplete={registering ? 'new-password' : 'current-password'} required value={values.password} onChange={change} error={errors.password} hint={registering ? 'At least 8 characters. Maximum 72 UTF-8 bytes.' : 'Enter the password for your account.'} />
        {registering && <fieldset className="role-picker" aria-describedby={errors.role ? 'role-error' : 'role-note'}>
          <legend>I’m joining as a</legend>
          <div className="role-options">{[['customer', 'Customer', 'Book and follow deliveries'], ['driver', 'Driver', 'Carry deliveries forward']].map(([value, label, description]) => <label key={value}>
            <input type="radio" name="role" value={value} checked={values.role === value} onChange={change} required aria-invalid={Boolean(errors.role)} />
            <span><strong>{label}</strong><small>{description}</small></span>
          </label>)}</div>
          {errors.role && <p id="role-error" className="field-error">{errors.role}</p>}
          <p id="role-note" className="role-note">{values.role === 'driver' ? 'Your operations team will set up your driver profile before you receive assignments.' : 'Operations accounts are managed by your organization.'}</p>
        </fieldset>}
        <Button type="submit" className="auth-submit" disabled={pending}>{pending ? <><span className="button-spinner" aria-hidden="true" />{registering ? 'Creating account…' : 'Signing in…'}</> : registering ? 'Create account' : 'Sign in'}<span aria-hidden="true">→</span></Button>
      </fieldset>
      <span className="sr-only" role="status">{pending ? 'Please wait while we verify your account.' : ''}</span>
    </form>
    <p className="auth-switch">{registering ? 'Already have an account? ' : 'New to Fleetline? '}<Link to={registering ? '/login' : '/register'}>{registering ? 'Sign in' : 'Create an account'}</Link></p>
  </section>
}
