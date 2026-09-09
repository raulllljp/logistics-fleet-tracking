const { body, query } = require("express-validator");
const mongoose = require("mongoose");
const { VEHICLE_TYPES, VEHICLE_STATUSES } = require("../utils/constants");

const allowedFields = ["registrationNumber", "type", "capacity", "status"];
const vehicleFields = (updating = false) => [
  body().custom(value => value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length > 0 && Object.keys(value).every(key => allowedFields.includes(key)))
    .withMessage("Provide only registrationNumber, type, capacity, or status; driver assignment is not allowed"),
  body("registrationNumber").optional(updating).isString().withMessage("Registration number is required").bail()
    .trim().notEmpty().withMessage("Registration number is required").toUpperCase(),
  body("type").optional(updating).isString().bail().isIn(VEHICLE_TYPES).withMessage("Invalid vehicle type"),
  body("capacity").optional(updating)
    .custom(value => typeof value === "number" && Number.isFinite(value) && value > 0)
    .withMessage("Capacity must be a number greater than zero"),
  body("status").optional().isString().bail().isIn(VEHICLE_STATUSES).withMessage("Invalid vehicle status"),
];

const createVehicleValidators = vehicleFields();
const updateVehicleValidators = vehicleFields(true);
const vehicleFilterValidators = [
  query("status").optional().isString().bail().isIn(VEHICLE_STATUSES).withMessage("Invalid vehicle status"),
  query("type").optional().isString().bail().isIn(VEHICLE_TYPES).withMessage("Invalid vehicle type"),
];

const validateVehicleId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid vehicle ID", errorCode: "INVALID_VEHICLE_ID" });
  }
  return next();
};

module.exports = { createVehicleValidators, updateVehicleValidators, vehicleFilterValidators, validateVehicleId };
