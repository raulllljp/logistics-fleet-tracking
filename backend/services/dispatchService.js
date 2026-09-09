const mongoose = require("mongoose");
const Shipment = require("../models/Shipment");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const StatusHistory = require("../models/StatusHistory");
const { USER_ROLES, ACTIVE_SHIPMENT_STATUSES } = require("../utils/constants");
const reject = (statusCode, errorCode, message) => {
  throw Object.assign(new Error(message), { statusCode, errorCode });
};
const fitsVehicleCapacity = (activeWeight, newWeight, capacity) =>
  Number.isFinite(activeWeight) && activeWeight >= 0 && Number.isFinite(newWeight)
  && newWeight > 0 && Number.isFinite(capacity) && activeWeight + newWeight <= capacity;

const assignShipment = ({ shipmentId, driverId, vehicleId, assignedByUserId }) =>
  mongoose.connection.transaction(async session => {
    const shipment = await Shipment.findById(shipmentId).session(session);
    if (!shipment) reject(404, "SHIPMENT_NOT_FOUND", "Shipment not found");
    if (shipment.status !== "BOOKED") reject(409, "SHIPMENT_NOT_BOOKABLE", "Only booked shipments can be assigned");
    if (shipment.assignedDriverId || shipment.assignedVehicleId) reject(409, "SHIPMENT_ALREADY_ASSIGNED", "Shipment already has an assignment");

    const driver = await Driver.findById(driverId).session(session);
    if (!driver) reject(404, "DRIVER_PROFILE_NOT_FOUND", "Driver profile not found");
    if (driver.isAvailable !== true) reject(409, "DRIVER_UNAVAILABLE", "Driver is unavailable");
    const user = await User.findById(driver.userId).session(session);
    if (!user || user.role !== USER_ROLES.DRIVER) reject(409, "DRIVER_UNAVAILABLE", "Driver account is invalid");
    if (user.isActive !== true) reject(409, "DRIVER_ACCOUNT_INACTIVE", "Driver account is inactive");

    const vehicle = await Vehicle.findById(vehicleId).session(session);
    if (!vehicle) reject(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
    if (vehicle.status === "maintenance") reject(409, "VEHICLE_MAINTENANCE", "Vehicle is in maintenance");
    if (vehicle.status === "inactive") reject(409, "VEHICLE_INACTIVE", "Vehicle is inactive");
    if (!["available", "assigned"].includes(vehicle.status)) reject(409, "VEHICLE_UNAVAILABLE", "Vehicle is unavailable");
    if (!driver.vehicleId?.equals(vehicle._id) || !vehicle.currentDriverId?.equals(driver._id)) {
      reject(409, "DRIVER_VEHICLE_MISMATCH", "Driver and vehicle must already be linked consistently");
    }
    if (!Number.isFinite(shipment.weight) || shipment.weight <= 0
      || !Number.isFinite(vehicle.capacity) || vehicle.capacity < shipment.weight) {
      reject(409, "VEHICLE_CAPACITY_EXCEEDED", "Vehicle capacity cannot accommodate the shipment weight");
    }
    if (await Shipment.exists({ assignedDriverId: driver._id, assignedVehicleId: { $ne: vehicle._id }, status: { $in: ACTIVE_SHIPMENT_STATUSES } }).session(session)) {
      reject(409, "DRIVER_VEHICLE_MISMATCH", "Driver has active work on another vehicle");
    }
    if (await Shipment.exists({ assignedVehicleId: vehicle._id, assignedDriverId: { $ne: driver._id }, status: { $in: ACTIVE_SHIPMENT_STATUSES } }).session(session)) {
      reject(409, "DRIVER_VEHICLE_MISMATCH", "Vehicle has active work for another driver");
    }
    const [workload] = await Shipment.aggregate([
      { $match: { _id: { $ne: shipment._id }, assignedVehicleId: vehicle._id, status: { $in: ACTIVE_SHIPMENT_STATUSES } } },
      { $group: { _id: null, weight: { $sum: "$weight" } } },
    ]).session(session);
    if (!fitsVehicleCapacity(workload?.weight ?? 0, shipment.weight, vehicle.capacity)) {
      reject(409, "VEHICLE_CAPACITY_EXCEEDED", "Total active shipment weight exceeds vehicle capacity");
    }

    // Shared driver/vehicle writes cause competing dispatch transactions to
    // conflict. The transaction helper retries and rechecks the current state.
    shipment.assignedDriverId = driver._id;
    shipment.assignedVehicleId = vehicle._id;
    shipment.status = "ASSIGNED";
    await shipment.save({ session });
    // Force a shared write even if status was already assigned. This prevents
    // concurrent capacity checks from both committing against an old workload.
    await Driver.updateOne({ _id: driver._id }, { $inc: { __v: 1 } }, { session });
    await Vehicle.updateOne({ _id: vehicle._id }, { $set: { status: "assigned" }, $inc: { __v: 1 } }, { session });
    const history = new StatusHistory({
      shipmentId: shipment._id, status: "ASSIGNED", timestamp: new Date(),
      updatedBy: assignedByUserId, note: "Shipment assigned to driver and vehicle",
    });
    await history.save({ session });
    return shipment;
  });

module.exports = { assignShipment, fitsVehicleCapacity };
