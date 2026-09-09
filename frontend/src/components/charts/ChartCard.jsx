import EmptyState from '../common/EmptyState'

export default function ChartCard({
  title,
  eyebrow,
  subtitle,
  badge,
  footnote,
  isEmpty = false,
  emptyTitle = 'No data available',
  emptyMessage = 'Metrics will appear here when records exist.',
  children,
  className = '',
}) {
  return (
    <article className={`chart-card ${className}`.trim()}>
      <header className="chart-card-header">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h3>{title}</h3>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {badge && <div className="chart-card-badge">{badge}</div>}
      </header>

      <div className="chart-card-body">
        {isEmpty ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          children
        )}
      </div>

      {footnote && <p className="chart-card-footnote">{footnote}</p>}
    </article>
  )
}
