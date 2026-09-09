import { useId } from 'react'
export default function Field({ label, error, hint, id: suppliedId, ...props }) {
  const generatedId = useId()
  const id = suppliedId || generatedId
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <input {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={error || hint ? id + '-help' : undefined} />
    {(error || hint) && <p id={id + '-help'} className={error ? 'field-error' : 'text-muted'}>{error || hint}</p>}
  </div>
}
