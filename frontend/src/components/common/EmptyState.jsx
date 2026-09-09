export default function EmptyState({ title, message, children }) {
  return <section className="state-card">
    <svg className="state-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z M4 7l8 4 8-4 M12 11v10 M8 5l8 4" />
    </svg>
    <h2>{title}</h2><p>{message}</p>{children}
  </section>
}
