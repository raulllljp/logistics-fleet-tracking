export default function LoadingScreen({ message = 'Checking your session…' }) {
  return <div className="loading-screen" role="status" aria-live="polite">
    <span className="spinner" aria-hidden="true" /><div className="session-copy"><h1>Getting your workspace ready.</h1><p>{message}</p></div>
  </div>
}
