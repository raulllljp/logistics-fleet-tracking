import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import ChartCard from './ChartCard'

const TRIP_COLORS = {
  Planned: '#64748b',
  Active: '#0284c7',
  Completed: '#16a34a',
  Cancelled: '#dc2626',
}

export default function TripSummaryChart({ data = {} }) {
  const {
    totalTrips = 0,
    plannedTrips = 0,
    activeTrips = 0,
    completedTrips = 0,
    cancelledTrips = 0,
    averageShipmentsPerTrip = 0,
  } = data || {}

  const isEmpty = totalTrips === 0

  const chartData = [
    { status: 'Planned', count: plannedTrips, color: TRIP_COLORS.Planned },
    { status: 'Active', count: activeTrips, color: TRIP_COLORS.Active },
    { status: 'Completed', count: completedTrips, color: TRIP_COLORS.Completed },
    { status: 'Cancelled', count: cancelledTrips, color: TRIP_COLORS.Cancelled },
  ]

  return (
    <ChartCard
      title="Trip Operations Summary"
      eyebrow="MULTI-SHIPMENT GROUPING"
      subtitle={`${totalTrips} total trips scheduled`}
      badge={
        <span className="chart-highlight-badge">
          {averageShipmentsPerTrip} Avg Shipments/Trip
        </span>
      }
      footnote="Grouped trips combine active shipments assigned to the same driver/vehicle pair to maximize fleet efficiency."
      isEmpty={isEmpty}
      emptyTitle="No trips recorded"
      emptyMessage="Grouped trips created in Trip Management will appear here."
    >
      <div className="chart-flex-layout">
        <div className="chart-svg-container" style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis
                dataKey="status"
                tick={{ fill: 'var(--color-ink)', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value, name, item) => [`${value} trips`, item.payload.status]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: 'var(--color-line)',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map(entry => (
                  <Cell key={entry.status} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-legend-metrics">
          <div className="chart-metric-row">
            <span className="metric-dot" style={{ background: TRIP_COLORS.Planned }} />
            <span className="metric-label">Planned</span>
            <strong>{plannedTrips}</strong>
          </div>
          <div className="chart-metric-row">
            <span className="metric-dot" style={{ background: TRIP_COLORS.Active }} />
            <span className="metric-label">Active</span>
            <strong>{activeTrips}</strong>
          </div>
          <div className="chart-metric-row">
            <span className="metric-dot" style={{ background: TRIP_COLORS.Completed }} />
            <span className="metric-label">Completed</span>
            <strong>{completedTrips}</strong>
          </div>
          <div className="chart-metric-row">
            <span className="metric-dot" style={{ background: TRIP_COLORS.Cancelled }} />
            <span className="metric-label">Cancelled</span>
            <strong>{cancelledTrips}</strong>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
