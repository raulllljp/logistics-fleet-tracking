const mongoose = require("mongoose");
const Driver = require("../models/Driver");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const { USER_ROLES, ACTIVE_SHIPMENT_STATUSES } = require("../utils/constants");
const Shipment = require("../models/Shipment");

const reject = (statusCode, message, errorCode) => {
  const error = new Error(message);
  Object.assign(error, { statusCode, errorCode });
  throw error;
};
const handleError = (error, next) => {
  if (error.code === 11000) {
    const userDuplicate = Boolean(error.keyPattern?.userId || error.keyValue?.userId);
    error = Object.assign(new Error(userDuplicate ? "User already has a driver profile" : "License number is already registered"), {
      statusCode: 409,
      errorCode: userDuplicate ? "DRIVER_PROFILE_ALREADY_EXISTS" : "LICENSE_ALREADY_EXISTS",
    });
  }
  if (!error.statusCode) error.expose = false;
  return next(error);
};
const populated = query => query.populate("userId", "name email role")
  .populate("vehicleId", "registrationNumber type status");
const requireDriver = driver => {
  if (!driver) reject(404, "Driver profile not found", "DRIVER_PROFILE_NOT_FOUND");
};

const createDriver = async (req, res, next) => {
  try {
    const { userId, phone } = req.body;
    const licenseNumber = req.body.licenseNumber.trim().toUpperCase();
    const user = await User.findById(userId);
    if (!user) reject(404, "User not found", "USER_NOT_FOUND");
    if (user.role !== USER_ROLES.DRIVER) reject(409, "User must have the driver role", "USER_NOT_DRIVER");
    if (await Driver.exists({ userId })) reject(409, "User already has a driver profile", "DRIVER_PROFILE_ALREADY_EXISTS");
    if (await Driver.exists({ licenseNumber })) reject(409, "License number is already registered", "LICENSE_ALREADY_EXISTS");
    const driver = await Driver.create({ userId, licenseNumber, phone, vehicleId: null, isAvailable: true });
    return res.status(201).json({ success: true, message: "Driver profile created successfully", data: { driver } });
  } catch (error) { return handleError(error, next); }
};

const getDrivers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.available !== undefined) filter.isAvailable = req.query.available === "true";
    if (req.query.vehicleAssigned !== undefined) filter.vehicleId = req.query.vehicleAssigned === "true" ? { $ne: null } : null;
    const drivers = await populated(Driver.find(filter).sort({ createdAt: -1, _id: -1 }));
    return res.json({ success: true, count: drivers.length, data: { drivers } });
  } catch (error) { return handleError(error, next); }
};

const getDriverById = async (req, res, next) => {
  try {
    const driver = await populated(Driver.findById(req.params.id));
    requireDriver(driver);
    return res.json({ success: true, data: { driver } });
  } catch (error) { return handleError(error, next); }
};

const getMyDriverProfile = async (req, res, next) => {
  try {
    const driver = await populated(Driver.findOne({ userId: req.user._id }));
    requireDriver(driver);
    return res.json({ success: true, data: { driver } });
  } catch (error) { return handleError(error, next); }
};

const updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    requireDriver(driver);
    const changes = {};
    for (const field of ["licenseNumber", "phone", "isAvailable"]) {
      if (req.body[field] !== undefined) changes[field] = req.body[field];
    }
    if (changes.licenseNumber !== undefined) {
      changes.licenseNumber = changes.licenseNumber.trim().toUpperCase();
      if (await Driver.exists({ licenseNumber: changes.licenseNumber, _id: { $ne: driver._id } })) {
        reject(409, "License number is already registered", "LICENSE_ALREADY_EXISTS");
      }
    }
    const updated = await Driver.findByIdAndUpdate(driver._id, { $set: changes }, { new: true, runValidators: true });
    requireDriver(updated);
    return res.json({ success: true, message: "Driver profile updated successfully", data: { driver: updated } });
  } catch (error) { return handleError(error, next); }
};

const assignVehicle = async (req, res, next) => {
  try {
    // Transactions roll back both writes on failure and retry write conflicts.
    const driver = await mongoose.connection.transaction(async session => {
      const driver = await Driver.findById(req.params.id).session(session);
      requireDriver(driver);
      const vehicle = await Vehicle.findById(req.body.vehicleId).session(session);
      if (!vehicle) reject(404, "Vehicle not found", "VEHICLE_NOT_FOUND");
      if (vehicle.status === "inactive") reject(409, "Vehicle is inactive", "VEHICLE_INACTIVE");
      if (vehicle.status === "maintenance") reject(409, "Vehicle is in maintenance", "VEHICLE_MAINTENANCE");
      if (vehicle.status !== "available") reject(409, "Vehicle is unavailable for linkage", "VEHICLE_UNAVAILABLE");
      if (await Shipment.exists({ status: { $in: ACTIVE_SHIPMENT_STATUSES },
        $or: [{ assignedDriverId: driver._id }, { assignedVehicleId: vehicle._id }],
      }).session(session)) reject(409, "Active shipment linkage cannot be changed", "VEHICLE_ASSIGNED");
      if (driver.vehicleId && !driver.vehicleId.equals(vehicle._id)) {
        reject(409, "Unassign the current vehicle first", "DRIVER_ALREADY_HAS_VEHICLE");
      }
      if (vehicle.currentDriverId && !vehicle.currentDriverId.equals(driver._id)) {
        reject(409, "Vehicle is already linked to another driver", "VEHICLE_ALREADY_LINKED");
      }
      // Check reverse references too, rather than overwriting inconsistent links.
      if (await Driver.exists({ vehicleId: vehicle._id, _id: { $ne: driver._id } }).session(session)) {
        reject(409, "Vehicle is already linked to another driver", "VEHICLE_ALREADY_LINKED");
      }
      if (await Vehicle.exists({ currentDriverId: driver._id, _id: { $ne: vehicle._id } }).session(session)) {
        reject(409, "Unassign the current vehicle first", "DRIVER_ALREADY_HAS_VEHICLE");
      }
      driver.vehicleId = vehicle._id;
      vehicle.currentDriverId = driver._id;
      await driver.save({ session });
      await vehicle.save({ session });
      return driver;
    });
    return res.json({ success: true, message: "Vehicle linked successfully", data: { driver } });
  } catch (error) { return handleError(error, next); }
};

const unassignVehicle = async (req, res, next) => {
  try {
    const driver = await mongoose.connection.transaction(async session => {
      const driver = await Driver.findById(req.params.id).session(session);
      requireDriver(driver);
      if (!driver.vehicleId) reject(409, "Driver has no vehicle", "DRIVER_HAS_NO_VEHICLE");
      const vehicle = await Vehicle.findById(driver.vehicleId).session(session);
      if (!vehicle) reject(404, "Vehicle not found", "VEHICLE_NOT_FOUND");
      if (vehicle.status === "assigned") reject(409, "An actively assigned vehicle cannot be unlinked", "VEHICLE_ASSIGNED");
      if (await Shipment.exists({ status: { $in: ACTIVE_SHIPMENT_STATUSES },
        $or: [{ assignedDriverId: driver._id }, { assignedVehicleId: vehicle._id }],
      }).session(session)) reject(409, "Active shipment linkage cannot be changed", "VEHICLE_ASSIGNED");
      if (!vehicle.currentDriverId || !vehicle.currentDriverId.equals(driver._id)) {
        reject(409, "Vehicle linkage is inconsistent; review the references", "VEHICLE_UNAVAILABLE");
      }
      driver.vehicleId = null;
      vehicle.currentDriverId = null;
      await driver.save({ session });
      await vehicle.save({ session });
      return driver;
    });
    return res.json({ success: true, message: "Vehicle unlinked successfully", data: { driver } });
  } catch (error) { return handleError(error, next); }
};

const getAvailableDrivers = async (req, res, next) => {
  try {
    const candidates = await Driver.find({ isAvailable: true, vehicleId: { $ne: null } })
      .sort({ createdAt: -1, _id: -1 })
      .populate({ path: "userId", select: "name email role", match: { role: USER_ROLES.DRIVER, isActive: true } })
      .populate({ path: "vehicleId", select: "registrationNumber type status capacity currentDriverId", match: { status: { $in: ["available", "assigned"] } } });
    // This list is advisory; dispatch revalidates conflicts in its transaction.
    const drivers = candidates.filter(driver => driver.userId && driver.vehicleId
      && driver.vehicleId.currentDriverId?.equals(driver._id));
    return res.json({ success: true, count: drivers.length, data: { drivers } });
  } catch (error) { return handleError(error, next); }
};

module.exports = { createDriver, getDrivers, getDriverById, getMyDriverProfile, updateDriver, assignVehicle, unassignVehicle, getAvailableDrivers };
