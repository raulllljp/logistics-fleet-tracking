import Button from '../ui/Button'
export default function ErrorState({ title = 'Unable to load this page', message, onRetry, children }) {
  return <section className="state-card" role="alert">
    <span className="state-symbol error-symbol" aria-hidden="true">!</span>
    <h2>{title}</h2><p>{message}</p>
    <div className="flex flex-wrap justify-center gap-3">
      {onRetry && <Button onClick={onRetry}>Try again</Button>}{children}
    </div>
  </section>
}
