import { useId, useState } from 'react'
export default function PasswordField({ error, hint, ...props }) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  return <div className="field">
    <label htmlFor={id}>Password</label>
    <div className="password-control">
      <input {...props} id={id} type={visible ? 'text' : 'password'} aria-invalid={Boolean(error)} aria-describedby={id + '-help'} />
      <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</button>
    </div>
    <div id={id + '-help'}>{error && <p className="field-error">{error}</p>}<p className="text-muted">{hint}</p></div>
  </div>
}
