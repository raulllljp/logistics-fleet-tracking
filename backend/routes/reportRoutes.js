const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validationMiddleware");
const { USER_ROLES } = require("../utils/constants");
const { reportValidators } = require("../middleware/reportValidators");
const { getFleetUtilization, getDriverWorkload, getShipmentSummary, getDeliveryPerformance, getTripSummary } = require("../controllers/reportController");

const router = express.Router();
router.use(authMiddleware, authorizeRoles(USER_ROLES.DISPATCHER, USER_ROLES.ADMIN));
router.get("/fleet-utilization", getFleetUtilization);
router.get("/driver-workload", getDriverWorkload);
router.get("/shipments", reportValidators, validateRequest, getShipmentSummary);
router.get("/delivery-performance", reportValidators, validateRequest, getDeliveryPerformance);
router.get("/trips", reportValidators, validateRequest, getTripSummary);
module.exports = router;
