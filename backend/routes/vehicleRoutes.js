const express = require("express");

const {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle
} = require("../controllers/vehicleController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createVehicle);

router.get("/", protect, getVehicles);

router.get("/:id", protect, getVehicleById);

router.put("/:id", protect, updateVehicle);

router.delete("/:id", protect, deleteVehicle);

module.exports = router;