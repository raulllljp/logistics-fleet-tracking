# Reporting definitions

All `/api/admin/reports` endpoints require dispatcher/admin authentication.
Reports aggregate real MongoDB records; unavailable MongoDB is an error, not an empty report.

- Fleet utilization: assigned vehicles / all non-inactive vehicles × 100.
  Maintenance vehicles remain in the operational denominator as specified by the project.
- Driver workload: current availability flags and permanent vehicle linkage counts.
  isAvailable means permission to accept more assignments, not an empty workload.
  The existing busyDrivers field counts explicitly unavailable/paused drivers;
  it does not count drivers with active shipments. Per-driver shipment breakdowns
  are not included. Vehicle utilization remains the active-workload indicator.
- Shipment summary: all six statuses, with zero values retained; BOOKED is pending,
  ASSIGNED/PICKED_UP/IN_TRANSIT are active, and DELIVERED/FAILED are terminal.
- Delivery success: delivered / (delivered + failed) × 100.
- On-time delivery: because Shipment has no promised delivery timestamp, this
  academic implementation uses a fixed 48-hour SLA from bookedAt to
  deliveryProof.deliveredAt. It can later use a shipment-specific promisedDeliveryAt.
  On-time delivered / all delivered × 100 is the percentage.
- Average delivery duration is in hours and uses only delivered records with valid,
  nonnegative timestamp differences. Missing/invalid timestamps do not count as
  on-time, remain in the delivered denominator, and are excluded from the average.
  validDurationCount makes that limitation visible.
- Trip summary includes each status and the mean shipment count per trip.

Percentages and averages round to two decimals. Empty collections yield zero counts,
percentages, and averages; deliverySlaHours remains 48.

Shipment summary and delivery performance filter by bookedAt, not completion date.
Trip summary filters by date. Optional from/to accept ISO dates: from is inclusive,
and a date-only to includes the entire UTC day. Full timestamps are inclusive exact
bounds; use an explicit timezone for timestamps. Fleet and driver reports are current
snapshots and do not apply date ranges.

Aggregation pipelines count records in MongoDB without loading all shipments into
JavaScript. Real MongoDB tests are still needed for aggregates, empty collections,
date boundaries, and authenticated role access.
