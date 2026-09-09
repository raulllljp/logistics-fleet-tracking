import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import ChartCard from './ChartCard'

export default function DriverWorkloadChart({ data = {} }) {
  const {
    totalDrivers = 0,
    availableDrivers = 0,
    busyDrivers = 0,
    driversWithVehicle = 0,
    driversWithoutVehicle = 0,
  } = data || {}

  const isEmpty = totalDrivers === 0

  const chartData = [
    {
      category: 'Availability',
      ActiveOrLinked: availableDrivers,
      PausedOrUnlinked: busyDrivers,
    },
    {
      category: 'Vehicle Linkage',
      ActiveOrLinked: driversWithVehicle,
      PausedOrUnlinked: driversWithoutVehicle,
    },
  ]

  return (
    <ChartCard
      title="Driver Workload & Fleet Linkage"
      eyebrow="CREW CAPACITY"
      subtitle={`${totalDrivers} driver profiles registered`}
      badge={
        <span className="chart-highlight-badge">
          {availableDrivers} Active Ready
        </span>
      }
      footnote="Note: 'busyDrivers' reflects the explicit unavailable/paused flag, not active multi-shipment workload. Active delivery workload is distributed by vehicle capacity."
      isEmpty={isEmpty}
      emptyTitle="No driver profiles"
      emptyMessage="Driver profiles created in Driver Management will appear here."
    >
      <div className="chart-flex-layout">
        <div className="chart-svg-container" style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis
                dataKey="category"
                tick={{ fill: 'var(--color-ink)', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value, name) => [
                  `${value} drivers`,
                  name === 'ActiveOrLinked' ? 'Available / Linked' : 'Paused / Unlinked',
                ]}
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
                formatter={value => (
                  <span style={{ color: 'var(--color-ink)', fontSize: '0.8rem' }}>
                    {value === 'ActiveOrLinked' ? 'Available / Linked' : 'Paused / Unlinked'}
                  </span>
                )}
              />
              <Bar dataKey="ActiveOrLinked" fill="#146b53" radius={[4, 4, 0, 0]} name="ActiveOrLinked" />
              <Bar dataKey="PausedOrUnlinked" fill="#896016" radius={[4, 4, 0, 0]} name="PausedOrUnlinked" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-legend-metrics">
          <div className="chart-metric-row">
            <span className="metric-dot" style={{ background: '#146b53' }} />
            <span className="metric-label">Available for Work</span>
            <strong>{availableDrivers}</strong>
          </div>
          <div className="chart-metric-row">
            <span className="metric-dot" style={{ background: '#896016' }} />
            <span className="metric-label">Paused by Operations</span>
            <strong>{busyDrivers}</strong>
          </div>
          <div className="chart-metric-row">
            <span className="metric-dot" style={{ background: '#1d70b8' }} />
            <span className="metric-label">Linked to Vehicle</span>
            <strong>{driversWithVehicle}</strong>
          </div>
          <div className="chart-metric-row">
            <span className="metric-dot" style={{ background: '#9ca3af' }} />
            <span className="metric-label">Unlinked Profile</span>
            <strong>{driversWithoutVehicle}</strong>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
