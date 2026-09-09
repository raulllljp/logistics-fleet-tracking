import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import ChartCard from './ChartCard'

const PERFORMANCE_COLORS = {
  Delivered: '#16a34a',
  Failed: '#dc2626',
}

export default function DeliveryPerformanceChart({ data = {} }) {
  const {
    totalCompletedAttempts = 0,
    deliveredShipments = 0,
    failedShipments = 0,
    onTimeDelivered = 0,
    averageDeliveryDurationHours = 0,
    deliverySuccessPercentage = 0,
    onTimeDeliveryPercentage = 0,
    deliverySlaHours = 48,
  } = data || {}

  const isEmpty = totalCompletedAttempts === 0

  const chartData = [
    { name: 'Delivered', value: deliveredShipments, color: PERFORMANCE_COLORS.Delivered },
    { name: 'Failed', value: failedShipments, color: PERFORMANCE_COLORS.Failed },
  ].filter(item => item.value > 0)

  return (
    <ChartCard
      title="Delivery Performance & SLA"
      eyebrow="FULFILLMENT QUALITY"
      subtitle={`${totalCompletedAttempts} total completed delivery attempts`}
      badge={
        <span className="chart-highlight-badge">
          {deliverySuccessPercentage}% Success
        </span>
      }
      footnote={`On-time delivery is measured against the project-defined ${deliverySlaHours}-hour academic SLA from booking to delivery.`}
      isEmpty={isEmpty}
      emptyTitle="No completed deliveries"
      emptyMessage="Delivery performance metrics will appear when shipments reach delivered or failed status."
    >
      <div className="chart-flex-layout">
        <div className="chart-svg-container" style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.length ? chartData : [{ name: 'None', value: 1, color: '#e5e7eb' }]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={chartData.length > 1 ? 3 : 0}
                dataKey="value"
                nameKey="name"
              >
                {(chartData.length ? chartData : [{ name: 'None', color: '#e5e7eb' }]).map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} attempts`, name]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: 'var(--color-line)',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={value => <span style={{ color: 'var(--color-ink)', fontSize: '0.8rem' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-kpi-grid">
          <div className="stat-card" style={{ padding: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>On-Time Rate</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--color-accent)' }}>
              {onTimeDeliveryPercentage}%
            </strong>
            <small style={{ color: 'var(--color-muted)' }}>{onTimeDelivered} on-time within {deliverySlaHours}h</small>
          </div>

          <div className="stat-card" style={{ padding: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Avg Duration</span>
            <strong style={{ fontSize: '1.4rem' }}>
              {averageDeliveryDurationHours} h
            </strong>
            <small style={{ color: 'var(--color-muted)' }}>From booking to delivery proof</small>
          </div>

          <div className="stat-card" style={{ padding: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Delivered vs Failed</span>
            <strong style={{ fontSize: '1.2rem' }}>
              {deliveredShipments} / {failedShipments}
            </strong>
            <small style={{ color: 'var(--color-muted)' }}>Completed shipments</small>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
