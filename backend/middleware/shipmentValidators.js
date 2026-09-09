const { body, query } = require("express-validator");
const mongoose = require("mongoose");
const { SHIPMENT_STATUSES } = require("../utils/constants");

const fields = allowed => body().custom(value => value && typeof value === "object" && !Array.isArray(value)
  && Object.keys(value).every(key => allowed.includes(key)))
  .withMessage(`Only these fields are accepted: ${allowed.join(", ")}`);
const pricingFields = () => [
  body("weight").custom(value => Number.isFinite(value) && value > 0).withMessage("Weight must be a number greater than zero"),
  body("distance").custom(value => Number.isFinite(value) && value >= 0).withMessage("Distance must be a nonnegative number"),
];
const createShipmentValidators = [
  fields(["pickupAddress", "dropAddress", "weight", "distance"]),
  ...["pickupAddress", "dropAddress"].map(field => body(field).isString().bail().trim()
    .isLength({ min: 5, max: 500 }).withMessage(`${field} must contain 5 to 500 characters`)),
  ...pricingFields(),
];
const estimateValidators = [fields(["weight", "distance"]), ...pricingFields()];
const statusFilter = () => query("status").optional().isString().bail()
  .isIn(SHIPMENT_STATUSES).withMessage("Invalid shipment status");
const myShipmentValidators = [statusFilter(),
  query("customerId").not().exists().withMessage("Customer ID is determined by your authenticated account")];
const allShipmentValidators = [statusFilter(),
  query("customerId").optional().isString().bail().isMongoId().withMessage("Invalid customer ID")];
const validateShipmentId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid shipment ID", errorCode: "INVALID_SHIPMENT_ID" });
  }
  return next();
};

const assignmentValidators = [
  fields(["driverId", "vehicleId"]),
  body("driverId").isString().bail().isMongoId().withMessage("Valid driver ID is required"),
  body("vehicleId").isString().bail().isMongoId().withMessage("Valid vehicle ID is required"),
];

const { DRIVER_STATUSES } = require("../services/shipmentWorkflowService");
const statusUpdateValidators = [
  fields(["status", "location", "note", "receiverName", "deliveryNotes"]),
  body().custom(value => value && (value.status === "DELIVERED"
    || (!Object.hasOwn(value, "receiverName") && !Object.hasOwn(value, "deliveryNotes"))))
    .withMessage("Delivery confirmation fields are only allowed for DELIVERED"),
  body("receiverName").if(body("status").equals("DELIVERED")).isString().withMessage("Receiver name is required").bail()
    .trim().isLength({ min: 2, max: 100 }).withMessage("Receiver name must contain 2 to 100 characters"),
  body("deliveryNotes").optional().isString().bail().trim().isLength({ max: 1000 }).withMessage("Delivery notes must not exceed 1000 characters"),
  // Known states reach the workflow service so forbidden jumps return 409.
  body("status").isString().bail().isIn(SHIPMENT_STATUSES).withMessage("Invalid shipment status"),
  body("location").optional().isString().bail().trim().isLength({ max: 200 }).withMessage("Location must not exceed 200 characters"),
  body("note").optional().isString().bail().trim().isLength({ max: 1000 }).withMessage("Note must not exceed 1000 characters"),
];
const driverShipmentValidators = [
  query("status").optional().isString().bail().isIn(["ASSIGNED", ...DRIVER_STATUSES]).withMessage("Invalid driver shipment status"),
];

module.exports = { createShipmentValidators, estimateValidators, myShipmentValidators, allShipmentValidators, validateShipmentId, assignmentValidators, statusUpdateValidators, driverShipmentValidators };
