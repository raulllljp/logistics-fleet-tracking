export default function LoadingScreen({ message = 'Checking your session…' }) {
  return <div className="loading-screen" role="status" aria-live="polite">
    <span className="spinner" aria-hidden="true" /><p>{message}</p>
  </div>
}
