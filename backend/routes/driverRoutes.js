const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validationMiddleware");
const { USER_ROLES } = require("../utils/constants");
const { createDriverValidators, updateDriverValidators, assignVehicleValidators, driverFilterValidators, validateDriverId } = require("../middleware/driverValidators");
const { createDriver, getDrivers, getDriverById, getMyDriverProfile, updateDriver, assignVehicle, unassignVehicle } = require("../controllers/driverController");

const router = express.Router();
const { getAvailableDrivers } = require("../controllers/driverController");
router.use(authMiddleware);
router.get("/me/profile", authorizeRoles(USER_ROLES.DRIVER), getMyDriverProfile);
router.use(authorizeRoles(USER_ROLES.DISPATCHER, USER_ROLES.ADMIN));
router.get("/available", getAvailableDrivers);
router.post("/", createDriverValidators, validateRequest, createDriver);
router.get("/", driverFilterValidators, validateRequest, getDrivers);
router.put("/:id/vehicle", validateDriverId, assignVehicleValidators, validateRequest, assignVehicle);
router.delete("/:id/vehicle", validateDriverId, unassignVehicle);
router.get("/:id", validateDriverId, getDriverById);
router.put("/:id", validateDriverId, updateDriverValidators, validateRequest, updateDriver);

module.exports = router;
