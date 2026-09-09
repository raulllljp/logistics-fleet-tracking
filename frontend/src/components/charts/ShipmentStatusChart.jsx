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

const STATUS_COLORS = {
  Booked: '#64748b',
  Assigned: '#0284c7',
  'Picked up': '#4f46e5',
  'In transit': '#d97706',
  Delivered: '#16a34a',
  Failed: '#dc2626',
}

export default function ShipmentStatusChart({ data = {} }) {
  const {
    totalShipments = 0,
    byStatus = {},
    pendingShipments = 0,
    activeShipments = 0,
    terminalShipments = 0,
  } = data || {}

  const isEmpty = totalShipments === 0

  const chartData = [
    { status: 'Booked', count: byStatus.BOOKED || 0, color: STATUS_COLORS.Booked },
    { status: 'Assigned', count: byStatus.ASSIGNED || 0, color: STATUS_COLORS.Assigned },
    { status: 'Picked up', count: byStatus.PICKED_UP || 0, color: STATUS_COLORS['Picked up'] },
    { status: 'In transit', count: byStatus.IN_TRANSIT || 0, color: STATUS_COLORS['In transit'] },
    { status: 'Delivered', count: byStatus.DELIVERED || 0, color: STATUS_COLORS.Delivered },
    { status: 'Failed', count: byStatus.FAILED || 0, color: STATUS_COLORS.Failed },
  ]

  return (
    <ChartCard
      title="Shipment Status Distribution"
      eyebrow="WORKLOAD LIFECYCLE"
      subtitle={`${pendingShipments} pending · ${activeShipments} active · ${terminalShipments} completed`}
      badge={
        <span className="chart-highlight-badge">
          {totalShipments} Total
        </span>
      }
      footnote="Canonical statuses: Booked (pending dispatch); Assigned, Picked up, In transit (active workload); Delivered, Failed (terminal outcomes)."
      isEmpty={isEmpty}
      emptyTitle="No shipment records"
      emptyMessage="Booked shipments will appear here across all lifecycle stages."
    >
      <div className="chart-svg-container" style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
          >
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="status"
              width={80}
              tick={{ fill: 'var(--color-ink)', fontSize: 12, fontWeight: 500 }}
            />
            <Tooltip
              formatter={(value, name, item) => [`${value} shipments`, item.payload.status]}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: 'var(--color-line)',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map(entry => (
                <Cell key={entry.status} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
