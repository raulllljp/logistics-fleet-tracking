import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import ChartCard from './ChartCard'

const FLEET_COLORS = {
  Available: '#146b53',
  Assigned: '#1d70b8',
  Maintenance: '#d97706',
  Inactive: '#9ca3af',
}

export default function FleetUtilizationChart({ data = {} }) {
  const {
    totalVehicles = 0,
    operationalVehicles = 0,
    availableVehicles = 0,
    assignedVehicles = 0,
    maintenanceVehicles = 0,
    inactiveVehicles = 0,
    utilizationPercentage = 0,
  } = data || {}

  const isEmpty = totalVehicles === 0

  const chartData = [
    { name: 'Available', value: availableVehicles, color: FLEET_COLORS.Available },
    { name: 'Assigned', value: assignedVehicles, color: FLEET_COLORS.Assigned },
    { name: 'Maintenance', value: maintenanceVehicles, color: FLEET_COLORS.Maintenance },
    { name: 'Inactive', value: inactiveVehicles, color: FLEET_COLORS.Inactive },
  ].filter(item => item.value > 0)

  return (
    <ChartCard
      title="Fleet Utilization"
      eyebrow="FLEET READINESS"
      subtitle={`${operationalVehicles} operational vehicles (${totalVehicles} total in fleet)`}
      badge={
        <span className="chart-highlight-badge">
          {utilizationPercentage}% Utilized
        </span>
      }
      footnote="Utilization = Assigned vehicles / Operational vehicles (Available + Assigned + Maintenance). Maintenance vehicles remain in the operational denominator."
      isEmpty={isEmpty}
      emptyTitle="No fleet vehicles"
      emptyMessage="Register vehicles in Fleet Management to visualize operational utilization."
    >
      <div className="chart-flex-layout">
        <div className="chart-svg-container" style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.length ? chartData : [{ name: 'None', value: 1, color: '#e5e7eb' }]}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={chartData.length > 1 ? 3 : 0}
                dataKey="value"
                nameKey="name"
              >
                {(chartData.length ? chartData : [{ name: 'None', color: '#e5e7eb' }]).map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} vehicles`, name]}
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

        <div className="chart-legend-metrics">
          <div className="chart-metric-row">
            <span className="metric-dot" style={{ background: FLEET_COLORS.Available }} />
            <span className="metric-label">Available</span>
            <strong>{availableVehicles}</strong>
          </div>
          <div className="chart-metric-row">
            <span className="metric-dot" style={{ background: FLEET_COLORS.Assigned }} />
            <span className="metric-label">Assigned</span>
            <strong>{assignedVehicles}</strong>
          </div>
          <div className="chart-metric-row">
            <span className="metric-dot" style={{ background: FLEET_COLORS.Maintenance }} />
            <span className="metric-label">Maintenance</span>
            <strong>{maintenanceVehicles}</strong>
          </div>
          <div className="chart-metric-row">
            <span className="metric-dot" style={{ background: FLEET_COLORS.Inactive }} />
            <span className="metric-label">Inactive</span>
            <strong>{inactiveVehicles}</strong>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
