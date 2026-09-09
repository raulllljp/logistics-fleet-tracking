const Vehicle = require("../models/Vehicle");

const statusTransitions = {
  available: ["maintenance", "inactive", "assigned"],
  maintenance: ["available", "inactive"],
  inactive: ["available"],
  assigned: ["available"],
};

const fail = (res, status, message, errorCode) => res.status(status).json({ success: false, message, errorCode });
const notFound = res => fail(res, 404, "Vehicle not found", "VEHICLE_NOT_FOUND");
const duplicate = res => fail(res, 409, "Registration number is already registered", "VEHICLE_ALREADY_EXISTS");

const handleError = (error, res, next) => {
  if (error.code === 11000) return duplicate(res);
  error.expose = false;
  return next(error);
};

const createVehicle = async (req, res, next) => {
  try {
    const { type, capacity, status } = req.body;
    if (status === "assigned") return fail(res, 409, "Assigned status is controlled by shipment dispatch", "INVALID_STATUS_TRANSITION");
    const registrationNumber = req.body.registrationNumber.trim().toUpperCase();
    if (await Vehicle.exists({ registrationNumber })) return duplicate(res);
    const vehicle = await Vehicle.create({ registrationNumber, type, capacity, status });
    return res.status(201).json({ success: true, message: "Vehicle created successfully", data: { vehicle } });
  } catch (error) { return handleError(error, res, next); }
};

const getVehicles = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status !== undefined) filter.status = req.query.status;
    if (req.query.type !== undefined) filter.type = req.query.type;
    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1, _id: -1 });
    return res.json({ success: true, count: vehicles.length, data: { vehicles } });
  } catch (error) { return handleError(error, res, next); }
};

const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return notFound(res);
    return res.json({ success: true, data: { vehicle } });
  } catch (error) { return handleError(error, res, next); }
};

const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return notFound(res);
    const changes = {};
    for (const field of ["registrationNumber", "type", "capacity", "status"]) {
      if (req.body[field] !== undefined) changes[field] = req.body[field];
    }
    if (changes.status !== undefined && changes.status !== vehicle.status
      && (changes.status === "assigned" || vehicle.status === "assigned")) {
      return fail(res, 409, "Operational assignment status is controlled by shipment workflow", "INVALID_STATUS_TRANSITION");
    }
    if (changes.registrationNumber !== undefined) {
      changes.registrationNumber = changes.registrationNumber.trim().toUpperCase();
      if (await Vehicle.exists({ registrationNumber: changes.registrationNumber, _id: { $ne: vehicle._id } })) return duplicate(res);
    }
    if (vehicle.status === "assigned" && (
      (changes.type !== undefined && changes.type !== vehicle.type)
      || (changes.capacity !== undefined && changes.capacity !== vehicle.capacity)
    )) return fail(res, 409, "Assigned vehicles cannot change type or capacity", "VEHICLE_ASSIGNED");

    if (changes.status === "inactive" && vehicle.currentDriverId) {
      return fail(res, 409, "A vehicle with a driver cannot be deactivated", "VEHICLE_HAS_DRIVER");
    }
    if (changes.status !== undefined && changes.status !== vehicle.status
      && !statusTransitions[vehicle.status].includes(changes.status)) {
      return fail(res, 409, "Invalid vehicle status transition", "INVALID_STATUS_TRANSITION");
    }

    // Match the checked state so a concurrent edit cannot bypass these rules.
    const updatedVehicle = await Vehicle.findOneAndUpdate(
      { _id: vehicle._id, status: vehicle.status, currentDriverId: vehicle.currentDriverId, updatedAt: vehicle.updatedAt },
      { $set: changes },
      { new: true, runValidators: true },
    );
    if (!updatedVehicle) return fail(res, 409, "Vehicle changed; reload and retry", "VEHICLE_CONFLICT");
    return res.json({ success: true, message: "Vehicle updated successfully", data: { vehicle: updatedVehicle } });
  } catch (error) { return handleError(error, res, next); }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return notFound(res);
    if (vehicle.status === "assigned") return fail(res, 409, "Assigned vehicles cannot be deactivated", "VEHICLE_ASSIGNED");
    if (vehicle.currentDriverId) return fail(res, 409, "A vehicle with a driver cannot be deactivated", "VEHICLE_HAS_DRIVER");

    const updatedVehicle = await Vehicle.findOneAndUpdate(
      { _id: vehicle._id, status: vehicle.status, currentDriverId: null, updatedAt: vehicle.updatedAt },
      { $set: { status: "inactive" } },
      { new: true, runValidators: true },
    );
    if (!updatedVehicle) return fail(res, 409, "Vehicle changed; reload and retry", "VEHICLE_CONFLICT");
    return res.json({ success: true, message: "Vehicle deactivated successfully" });
  } catch (error) { return handleError(error, res, next); }
};

module.exports = { createVehicle, getVehicles, getVehicleById, updateVehicle, deleteVehicle };
