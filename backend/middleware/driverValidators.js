const { body, query } = require("express-validator");
const mongoose = require("mongoose");

const fields = allowed => body().custom(value => value && typeof value === "object" && !Array.isArray(value)
  && Object.keys(value).length > 0 && Object.keys(value).every(key => allowed.includes(key)))
  .withMessage(`Provide only: ${allowed.join(", ")}`);
const license = updating => body("licenseNumber").optional(updating).isString().bail()
  .trim().isLength({ min: 5, max: 40 }).withMessage("License number must contain 5 to 40 characters").toUpperCase();
const phone = updating => body("phone").optional(updating).isString().bail()
  .trim().isLength({ min: 7, max: 25 }).withMessage("Phone must contain 7 to 25 characters");

const createDriverValidators = [
  fields(["userId", "licenseNumber", "phone"]),
  body("userId").isString().bail().isMongoId().withMessage("Valid user ID is required"),
  license(false), phone(false),
];
const updateDriverValidators = [
  fields(["licenseNumber", "phone", "isAvailable"]), license(true), phone(true),
  body("isAvailable").optional().custom(value => typeof value === "boolean").withMessage("isAvailable must be a boolean"),
];
const assignVehicleValidators = [
  fields(["vehicleId"]),
  body("vehicleId").isString().bail().isMongoId().withMessage("Valid vehicle ID is required"),
];
const driverFilterValidators = ["available", "vehicleAssigned"].map(field =>
  query(field).optional().isString().bail().isIn(["true", "false"]).withMessage(`${field} must be true or false`));

const validateDriverId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid driver ID", errorCode: "INVALID_DRIVER_ID" });
  }
  return next();
};

module.exports = { createDriverValidators, updateDriverValidators, assignVehicleValidators, driverFilterValidators, validateDriverId };
