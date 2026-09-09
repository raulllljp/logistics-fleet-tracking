const { body, query } = require("express-validator");
const mongoose = require("mongoose");
const { TRIP_STATUSES } = require("../utils/constants");

const fields = allowed => body().custom(value => value && typeof value === "object" && !Array.isArray(value)
  && Object.keys(value).every(key => allowed.includes(key))).withMessage(`Only these fields are accepted: ${allowed.join(", ")}`);
const createTripValidators = [
  fields(["driverId", "vehicleId", "shipmentIds", "date"]),
  ...["driverId", "vehicleId"].map(field => body(field).isString().bail().isMongoId().withMessage(`Valid ${field} is required`)),
  body("shipmentIds").isArray({ min: 1 }).withMessage("At least one shipment is required").bail()
    .custom(ids => ids.every(id => typeof id === "string" && mongoose.Types.ObjectId.isValid(id)))
    .withMessage("Every shipment ID must be valid").bail()
    .custom(ids => new Set(ids.map(id => id.toLowerCase())).size === ids.length).withMessage("Duplicate shipment IDs are not allowed"),
  body("date").optional().isString().bail().isISO8601({ strict: true }).withMessage("Date must be a valid ISO date").toDate(),
];
const updateTripStatusValidators = [fields(["status"]),
  body("status").isString().bail().isIn(TRIP_STATUSES).withMessage("Invalid trip status")];
const statusFilter = () => query("status").optional().isString().bail().isIn(TRIP_STATUSES).withMessage("Invalid trip status");
const tripFilterValidators = [statusFilter(),
  ...["driverId", "vehicleId"].map(field => query(field).optional().isString().bail().isMongoId().withMessage(`Invalid ${field}`))];
const myTripValidators = [statusFilter(), query("driverId").not().exists().withMessage("Driver identity comes from your account")];
const validateTripId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid trip ID", errorCode: "INVALID_TRIP_ID" });
  return next();
};
module.exports = { createTripValidators, updateTripStatusValidators, tripFilterValidators, myTripValidators, validateTripId };
