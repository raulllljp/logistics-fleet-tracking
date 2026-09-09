const mongoose = require("mongoose");
const Trip = require("../models/Trip");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const Shipment = require("../models/Shipment");

const transitions = { planned: ["active", "cancelled"], active: ["completed", "cancelled"], completed: [], cancelled: [] };
const isValidTripTransition = (from, to) => Object.hasOwn(transitions, from) && transitions[from].includes(to);
const reject = (statusCode, errorCode, message) => { throw Object.assign(new Error(message), { statusCode, errorCode }); };
const handleError = (error, next) => {
  if (error.code === 11000) error = Object.assign(new Error("Shipment already belongs to a planned or active trip"), { statusCode: 409, errorCode: "SHIPMENT_ALREADY_IN_TRIP" });
  if (!error.statusCode) error.expose = false;
  return next(error);
};
const populated = query => query
  .populate({ path: "driverId", select: "licenseNumber userId", populate: { path: "userId", select: "name" } })
  .populate("vehicleId", "registrationNumber type")
  .populate("shipmentIds", "pickupAddress dropAddress status");

const createTrip = async (req, res, next) => {
  try {
    const { driverId, vehicleId, shipmentIds, date } = req.body;
    const trip = await mongoose.connection.transaction(async session => {
      const driver = await Driver.findById(driverId).session(session);
      if (!driver) reject(404, "DRIVER_PROFILE_NOT_FOUND", "Driver profile not found");
      const vehicle = await Vehicle.findById(vehicleId).session(session);
      if (!vehicle) reject(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
      if (!driver.vehicleId?.equals(vehicle._id) || !vehicle.currentDriverId?.equals(driver._id)) reject(409, "DRIVER_VEHICLE_MISMATCH", "Driver and vehicle must be linked consistently");
      const shipments = await Shipment.find({ _id: { $in: shipmentIds } }).session(session);
      if (shipments.length !== shipmentIds.length) reject(404, "SHIPMENT_NOT_FOUND", "One or more shipments were not found");
      for (const shipment of shipments) {
        if (!shipment.assignedDriverId?.equals(driver._id) || !shipment.assignedVehicleId?.equals(vehicle._id)) reject(409, "SHIPMENT_ASSIGNMENT_MISMATCH", "Every shipment must be assigned to this driver and vehicle");
        if (!["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(shipment.status)) reject(409, "SHIPMENT_NOT_ELIGIBLE_FOR_TRIP", "Only active assigned shipments can be grouped");
      }
      if (await Trip.exists({ shipmentIds: { $in: shipmentIds }, status: { $in: ["planned", "active"] } }).session(session)) reject(409, "SHIPMENT_ALREADY_IN_TRIP", "Shipment already belongs to a planned or active trip");
      const trip = new Trip({ driverId, vehicleId, shipmentIds, date, status: "planned" });
      await trip.save({ session });
      return trip;
    });
    return res.status(201).json({ success: true, message: "Trip created successfully", data: { trip } });
  } catch (error) { return handleError(error, next); }
};

const getTrips = async (req, res, next) => {
  try {
    const filter = {};
    for (const field of ["status", "driverId", "vehicleId"]) if (req.query[field] !== undefined) filter[field] = req.query[field];
    const trips = await populated(Trip.find(filter).sort({ date: -1, _id: -1 }));
    return res.json({ success: true, count: trips.length, data: { trips } });
  } catch (error) { return handleError(error, next); }
};
const getMyTrips = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) reject(404, "DRIVER_PROFILE_NOT_FOUND", "Driver profile not found");
    const filter = { driverId: driver._id };
    if (req.query.status !== undefined) filter.status = req.query.status;
    const trips = await populated(Trip.find(filter).sort({ date: -1, _id: -1 }));
    return res.json({ success: true, count: trips.length, data: { trips } });
  } catch (error) { return handleError(error, next); }
};
const getTripById = async (req, res, next) => {
  try {
    const trip = await populated(Trip.findById(req.params.id));
    if (!trip) reject(404, "TRIP_NOT_FOUND", "Trip not found");
    return res.json({ success: true, data: { trip } });
  } catch (error) { return handleError(error, next); }
};
const updateTripStatus = async (req, res, next) => {
  try {
    const trip = await mongoose.connection.transaction(async session => {
      const trip = await Trip.findById(req.params.id).session(session);
      if (!trip) reject(404, "TRIP_NOT_FOUND", "Trip not found");
      if (!isValidTripTransition(trip.status, req.body.status)) reject(409, "INVALID_TRIP_STATUS_TRANSITION", "Invalid trip status transition");
      if (req.body.status === "completed") {
        const shipments = await Shipment.find({ _id: { $in: trip.shipmentIds } }).session(session);
        if (shipments.length !== trip.shipmentIds.length) reject(404, "SHIPMENT_NOT_FOUND", "One or more trip shipments were not found");
        if (shipments.some(shipment => !["DELIVERED", "FAILED"].includes(shipment.status))) reject(409, "TRIP_HAS_ACTIVE_SHIPMENTS", "All trip shipments must be delivered or failed before completion");
      }
      trip.status = req.body.status;
      await trip.save({ session });
      return trip;
    });
    return res.json({ success: true, message: "Trip status updated successfully", data: { trip } });
  } catch (error) { return handleError(error, next); }
};

module.exports = { createTrip, getTrips, getTripById, getMyTrips, updateTripStatus, isValidTripTransition };
