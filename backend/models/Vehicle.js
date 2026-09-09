const mongoose = require("mongoose");
const { VEHICLE_TYPES, VEHICLE_STATUSES } = require("../utils/constants");

const vehicleSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, required: true, enum: VEHICLE_TYPES },
  // Maximum payload in kilograms.
  capacity: {
    type: Number,
    required: true,
    validate: { validator: value => Number.isFinite(value) && value > 0, message: "Capacity must be greater than zero" },
  },
  status: { type: String, enum: VEHICLE_STATUSES, default: "available", index: true },
  currentDriverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null, index: true },
}, { timestamps: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);
