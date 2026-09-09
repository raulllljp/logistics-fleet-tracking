const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Shipment = require("../models/Shipment");
const Trip = require("../models/Trip");
const { SHIPMENT_STATUSES, DEFAULT_DELIVERY_SLA_HOURS } = require("../utils/constants");
const { dateBound } = require("../middleware/reportValidators");

const round = value => Math.round(value * 100) / 100;
const percentage = (part, total) => total ? round(part / total * 100) : 0;
const dateFilter = (query, field) => {
  const range = {};
  if (query.from !== undefined) range.$gte = dateBound(query.from);
  if (query.to !== undefined) range.$lte = dateBound(query.to, true);
  return Object.keys(range).length ? { [field]: range } : {};
};
const handleError = (error, next) => {
  error.expose = false;
  return next(error);
};
const statusCounts = async (Model, match = {}) => {
  const rows = await Model.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map(row => [row._id, row.count]));
};

const getFleetUtilization = async (req, res, next) => {
  try {
    const counts = await statusCounts(Vehicle);
    const totalVehicles = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const inactiveVehicles = counts.inactive || 0;
    const operationalVehicles = totalVehicles - inactiveVehicles;
    const assignedVehicles = counts.assigned || 0;
    return res.json({ success: true, data: {
      totalVehicles, operationalVehicles, availableVehicles: counts.available || 0,
      assignedVehicles, maintenanceVehicles: counts.maintenance || 0, inactiveVehicles,
      utilizedVehicles: assignedVehicles, utilizationPercentage: percentage(assignedVehicles, operationalVehicles),
    } });
  } catch (error) { return handleError(error, next); }
};

const getDriverWorkload = async (req, res, next) => {
  try {
    const [data] = await Driver.aggregate([{ $group: {
      _id: null, totalDrivers: { $sum: 1 },
      availableDrivers: { $sum: { $cond: [{ $eq: ["$isAvailable", true] }, 1, 0] } },
      busyDrivers: { $sum: { $cond: [{ $eq: ["$isAvailable", false] }, 1, 0] } },
      driversWithVehicle: { $sum: { $cond: [{ $ne: [{ $ifNull: ["$vehicleId", null] }, null] }, 1, 0] } },
    } }, { $project: { _id: 0, totalDrivers: 1, availableDrivers: 1, busyDrivers: 1, driversWithVehicle: 1,
      driversWithoutVehicle: { $subtract: ["$totalDrivers", "$driversWithVehicle"] } } }]);
    return res.json({ success: true, data: data || { totalDrivers: 0, availableDrivers: 0, busyDrivers: 0, driversWithVehicle: 0, driversWithoutVehicle: 0 } });
  } catch (error) { return handleError(error, next); }
};

const getShipmentSummary = async (req, res, next) => {
  try {
    const counts = await statusCounts(Shipment, dateFilter(req.query, "bookedAt"));
    const byStatus = Object.fromEntries(SHIPMENT_STATUSES.map(status => [status, counts[status] || 0]));
    return res.json({ success: true, data: {
      totalShipments: Object.values(counts).reduce((sum, count) => sum + count, 0), byStatus,
      pendingShipments: byStatus.BOOKED,
      activeShipments: byStatus.ASSIGNED + byStatus.PICKED_UP + byStatus.IN_TRANSIT,
      terminalShipments: byStatus.DELIVERED + byStatus.FAILED,
    } });
  } catch (error) { return handleError(error, next); }
};

const getDeliveryPerformance = async (req, res, next) => {
  try {
    const [row] = await Shipment.aggregate([
      { $match: { ...dateFilter(req.query, "bookedAt"), status: { $in: ["DELIVERED", "FAILED"] } } },
      { $project: { status: 1, duration: { $cond: [
        { $and: [{ $eq: ["$status", "DELIVERED"] }, { $eq: [{ $type: "$bookedAt" }, "date"] },
          { $eq: [{ $type: "$deliveryProof.deliveredAt" }, "date"] }, { $gte: ["$deliveryProof.deliveredAt", "$bookedAt"] }] },
        { $divide: [{ $subtract: ["$deliveryProof.deliveredAt", "$bookedAt"] }, 3600000] }, null,
      ] } } },
      { $group: {
        _id: null, totalCompletedAttempts: { $sum: 1 },
        deliveredShipments: { $sum: { $cond: [{ $eq: ["$status", "DELIVERED"] }, 1, 0] } },
        failedShipments: { $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] } },
        onTimeDelivered: { $sum: { $cond: [{ $and: [{ $ne: ["$duration", null] }, { $lte: ["$duration", DEFAULT_DELIVERY_SLA_HOURS] }] }, 1, 0] } },
        validDurationCount: { $sum: { $cond: [{ $ne: ["$duration", null] }, 1, 0] } },
        averageDeliveryDurationHours: { $avg: "$duration" },
      } },
    ]);
    const data = row || { totalCompletedAttempts: 0, deliveredShipments: 0, failedShipments: 0, onTimeDelivered: 0, validDurationCount: 0, averageDeliveryDurationHours: 0 };
    delete data._id;
    data.deliverySuccessPercentage = percentage(data.deliveredShipments, data.totalCompletedAttempts);
    data.onTimeDeliveryPercentage = percentage(data.onTimeDelivered, data.deliveredShipments);
    data.averageDeliveryDurationHours = round(data.averageDeliveryDurationHours || 0);
    data.deliverySlaHours = DEFAULT_DELIVERY_SLA_HOURS;
    return res.json({ success: true, data });
  } catch (error) { return handleError(error, next); }
};

const getTripSummary = async (req, res, next) => {
  try {
    const rows = await Trip.aggregate([{ $match: dateFilter(req.query, "date") },
      { $group: { _id: "$status", count: { $sum: 1 }, shipments: { $sum: { $size: "$shipmentIds" } } } }]);
    const counts = Object.fromEntries(rows.map(row => [row._id, row.count]));
    const totalTrips = rows.reduce((sum, row) => sum + row.count, 0);
    return res.json({ success: true, data: {
      totalTrips, plannedTrips: counts.planned || 0, activeTrips: counts.active || 0,
      completedTrips: counts.completed || 0, cancelledTrips: counts.cancelled || 0,
      averageShipmentsPerTrip: totalTrips ? round(rows.reduce((sum, row) => sum + row.shipments, 0) / totalTrips) : 0,
    } });
  } catch (error) { return handleError(error, next); }
};

module.exports = { getFleetUtilization, getDriverWorkload, getShipmentSummary, getDeliveryPerformance, getTripSummary, percentage };
