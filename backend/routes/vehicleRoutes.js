const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validationMiddleware");
const { USER_ROLES } = require("../utils/constants");
const { createVehicleValidators, updateVehicleValidators, vehicleFilterValidators, validateVehicleId } = require("../middleware/vehicleValidators");
const { createVehicle, getVehicles, getVehicleById, updateVehicle, deleteVehicle } = require("../controllers/vehicleController");

const router = express.Router();

router.use(authMiddleware, authorizeRoles(USER_ROLES.DISPATCHER, USER_ROLES.ADMIN));
router.post("/", createVehicleValidators, validateRequest, createVehicle);
router.get("/", vehicleFilterValidators, validateRequest, getVehicles);
router.get("/:id", validateVehicleId, getVehicleById);
router.put("/:id", validateVehicleId, updateVehicleValidators, validateRequest, updateVehicle);
router.delete("/:id", validateVehicleId, deleteVehicle);

module.exports = router;
