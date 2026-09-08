const Vehicle = require("../models/vehicle");


// Create vehicle
const createVehicle = async (req, res) => {
    try {
        const { type, capacity, status } = req.body;

        if (!type || capacity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Vehicle type and capacity are required"
            });
        }

        const vehicle = await Vehicle.create({
            type,
            capacity,
            status: status || "available"
        });

        res.status(201).json({
            success: true,
            message: "Vehicle created successfully",
            data: vehicle
        });

    } catch (error) {
        console.error("Create vehicle error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating vehicle"
        });
    }
};


// Get all vehicles
const getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find()
            .populate("currentDriverId");

        res.status(200).json({
            success: true,
            count: vehicles.length,
            data: vehicles
        });

    } catch (error) {
        console.error("Get vehicles error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching vehicles"
        });
    }
};


// Get one vehicle
const getVehicleById = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id)
            .populate("currentDriverId");

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        res.status(200).json({
            success: true,
            data: vehicle
        });

    } catch (error) {
        console.error("Get vehicle error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching vehicle"
        });
    }
};


// Update vehicle
const updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Vehicle updated successfully",
            data: vehicle
        });

    } catch (error) {
        console.error("Update vehicle error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating vehicle"
        });
    }
};


// Delete vehicle
const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Vehicle deleted successfully"
        });

    } catch (error) {
        console.error("Delete vehicle error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting vehicle"
        });
    }
};


module.exports = {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle
};