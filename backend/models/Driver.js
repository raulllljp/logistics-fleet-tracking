const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  licenseNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  phone: { type: String, required: true, trim: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null, index: true },
  // Explicit permission to accept more work, independent of active shipment count.
  isAvailable: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model("Driver", driverSchema);
