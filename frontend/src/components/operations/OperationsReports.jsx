import { useState } from 'react'
import { useOperations } from '../../hooks/useOperations'
import { StatCard, LoadState, OperationsHeader } from './OperationsUI'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { ShipmentsManager } from './ShipmentManagement'
import { Link } from 'react-router-dom'
import FleetUtilizationChart from '../charts/FleetUtilizationChart'
import ShipmentStatusChart from '../charts/ShipmentStatusChart'
import DeliveryPerformanceChart from '../charts/DeliveryPerformanceChart'
import DriverWorkloadChart from '../charts/DriverWorkloadChart'
import TripSummaryChart from '../charts/TripSummaryChart'

export function ReportsView() {
  const [fromInput, setFromInput] = useState('')
  const [toInput, setToInput] = useState('')
  const [appliedFilter, setAppliedFilter] = useState({ from: '', to: '' })
  const [validationError, setValidationError] = useState('')

  const handleApplyFilter = event => {
    event.preventDefault()
    if (fromInput && toInput && fromInput > toInput) {
      setValidationError("'From' date must be on or before 'To' date.")
      return
    }
    setValidationError('')
    setAppliedFilter({ from: fromInput, to: toInput })
  }

  const handleClearFilter = () => {
    setFromInput('')
    setToInput('')
    setValidationError('')
    setAppliedFilter({ from: '', to: '' })
  }

  const filterParams = {
    ...(appliedFilter.from ? { from: appliedFilter.from } : {}),
    ...(appliedFilter.to ? { to: appliedFilter.to } : {}),
  }

  const fleetState = useOperations('fleet')
  const workloadState = useOperations('workload')
  const summaryState = useOperations('summary', filterParams)
  const performanceState = useOperations('performance', filterParams)
  const tripReportState = useOperations('tripReport', filterParams)

  const isAnyRefreshing =
    fleetState.refreshing ||
    workloadState.refreshing ||
    summaryState.refreshing ||
    performanceState.refreshing ||
    tripReportState.refreshing

  const handleRefreshAll = () => {
    fleetState.refresh()
    workloadState.refresh()
    summaryState.refresh()
    performanceState.refresh()
    tripReportState.refresh()
  }

  const activeRangeText =
    appliedFilter.from || appliedFilter.to
      ? `Filtered: ${appliedFilter.from || 'Start'} to ${appliedFilter.to || 'Present'}`
      : 'All-time reporting snapshot'

  return (
    <div className="page-stack">
      <header className="customer-header">
        <div>
          <p className="eyebrow">OPERATIONS WORKSPACE</p>
          <h1>Reports</h1>
          <p className="page-description">
            Current backend summaries and detailed fleet visualizations.
          </p>
        </div>
        <div className="customer-actions">
          <Button
            variant="quiet"
            disabled={isAnyRefreshing}
            onClick={handleRefreshAll}
          >
            {isAnyRefreshing ? 'Refreshing…' : 'Refresh reports'}
          </Button>
        </div>
      </header>

      {/* Date Range Filtering */}
      <form className="reports-date-bar" onSubmit={handleApplyFilter}>
        <Field
          label="From date (bookedAt)"
          name="from"
          type="date"
          value={fromInput}
          onChange={e => {
            setFromInput(e.target.value)
            setValidationError('')
          }}
        />
        <Field
          label="To date (bookedAt)"
          name="to"
          type="date"
          value={toInput}
          onChange={e => {
            setToInput(e.target.value)
            setValidationError('')
          }}
        />
        <div className="customer-actions" style={{ paddingBottom: '0.2rem' }}>
          <Button type="submit">Apply filter</Button>
          {(appliedFilter.from || appliedFilter.to) && (
            <Button variant="quiet" type="button" onClick={handleClearFilter}>
              Clear
            </Button>
          )}
        </div>
        <span
          className="text-muted"
          style={{ fontSize: '0.8rem', marginLeft: 'auto', alignSelf: 'center' }}
        >
          {activeRangeText}
        </span>
        {validationError && (
          <p
            className="field-error"
            role="alert"
            style={{ width: '100%', margin: '0.5rem 0 0' }}
          >
            {validationError}
          </p>
        )}
      </form>

      {/* KPI Summary Row */}
      <div className="operations-stats">
        <StatCard
          label="Fleet utilization"
          value={
            fleetState.data
              ? `${fleetState.data.utilizationPercentage}%`
              : '—'
          }
          supportingText="Assigned / Operational"
        />
        <StatCard
          label="Available vehicles"
          value={fleetState.data?.availableVehicles ?? '—'}
          supportingText="Ready for dispatch"
        />
        <StatCard
          label="Active shipments"
          value={summaryState.data?.activeShipments ?? '—'}
          supportingText="In transit or assigned"
        />
        <StatCard
          label="Delivery success"
          value={
            performanceState.data
              ? `${performanceState.data.deliverySuccessPercentage}%`
              : '—'
          }
          supportingText="Completed attempts"
        />
        <StatCard
          label="On-time delivery"
          value={
            performanceState.data
              ? `${performanceState.data.onTimeDeliveryPercentage}%`
              : '—'
          }
          supportingText="48-hour academic SLA"
        />
        <StatCard
          label="Avg duration"
          value={
            performanceState.data?.averageDeliveryDurationHours !== undefined
              ? `${performanceState.data.averageDeliveryDurationHours} h`
              : '—'
          }
          supportingText="Booking to delivery proof"
        />
      </div>

      {/* 1. Fleet Utilization Section */}
      <section>
        <div className="section-heading">
          <h2>Fleet utilization</h2>
          <button
            className="button button-quiet"
            disabled={fleetState.loading}
            onClick={fleetState.refresh}
          >
            Refresh
          </button>
        </div>
        <LoadState state={fleetState}>
          <FleetUtilizationChart data={fleetState.data} />
        </LoadState>
      </section>

      {/* 2. Shipment Status Section */}
      <section>
        <div className="section-heading">
          <h2>Shipment summary</h2>
          <button
            className="button button-quiet"
            disabled={summaryState.loading}
            onClick={summaryState.refresh}
          >
            Refresh
          </button>
        </div>
        <LoadState state={summaryState}>
          <ShipmentStatusChart data={summaryState.data} />
        </LoadState>
      </section>

      {/* 3. Delivery Performance Section */}
      <section>
        <div className="section-heading">
          <h2>Delivery performance</h2>
          <button
            className="button button-quiet"
            disabled={performanceState.loading}
            onClick={performanceState.refresh}
          >
            Refresh
          </button>
        </div>
        <LoadState state={performanceState}>
          <DeliveryPerformanceChart data={performanceState.data} />
        </LoadState>
      </section>

      {/* 4. Driver Workload Section */}
      <section>
        <div className="section-heading">
          <h2>Driver workload</h2>
          <button
            className="button button-quiet"
            disabled={workloadState.loading}
            onClick={workloadState.refresh}
          >
            Refresh
          </button>
        </div>
        <LoadState state={workloadState}>
          <DriverWorkloadChart data={workloadState.data} />
        </LoadState>
      </section>

      {/* 5. Trip Summary Section */}
      <section>
        <div className="section-heading">
          <h2>Trip summary</h2>
          <button
            className="button button-quiet"
            disabled={tripReportState.loading}
            onClick={tripReportState.refresh}
          >
            Refresh
          </button>
        </div>
        <LoadState state={tripReportState}>
          <TripSummaryChart data={tripReportState.data} />
        </LoadState>
      </section>
    </div>
  )
}

export function Overview() {
  const summaryState = useOperations('summary')
  const fleetState = useOperations('fleet')

  return (
    <div className="page-stack">
      <OperationsHeader title="Operations overview" state={summaryState}>
        <Link className="button button-quiet" to="/operations/reports">
          View deep analytics →
        </Link>
      </OperationsHeader>

      <LoadState state={summaryState}>
        <div className="operations-stats">
          <StatCard
            label="Total shipments"
            value={summaryState.data?.totalShipments ?? '—'}
          />
          <StatCard
            label="Awaiting dispatch"
            value={summaryState.data?.pendingShipments ?? '—'}
          />
          <StatCard
            label="Active shipments"
            value={summaryState.data?.activeShipments ?? '—'}
          />
          <StatCard
            label="Delivered"
            value={summaryState.data?.byStatus?.DELIVERED ?? '—'}
          />
          <StatCard
            label="Failed"
            value={summaryState.data?.byStatus?.FAILED ?? '—'}
          />
          <StatCard
            label="Fleet utilization"
            value={
              fleetState.data
                ? `${fleetState.data.utilizationPercentage}%`
                : '—'
            }
          />
        </div>
      </LoadState>

      <ShipmentsManager pendingOnly />

      <div className="customer-actions" style={{ marginTop: '1rem' }}>
        <Link className="button button-primary" to="/operations/reports">
          Open Analytics & Charts
        </Link>
        <Link className="button button-quiet" to="/operations/shipments">
          Manage shipments
        </Link>
        <Link className="button button-quiet" to="/operations/vehicles">
          Manage vehicles
        </Link>
        <Link className="button button-quiet" to="/operations/drivers">
          Manage drivers
        </Link>
        <Link className="button button-quiet" to="/operations/trips">
          Manage trips
        </Link>
      </div>
    </div>
  )
}
