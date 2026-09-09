const mongoose = require("mongoose");
const { TRIP_STATUSES } = require("../utils/constants");

const tripSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true, index: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
  shipmentIds: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true }],
    required: true,
    validate: { validator: value => Array.isArray(value) && value.length > 0
      && new Set(value.map(String)).size === value.length, message: "A trip must contain at least one shipment with no duplicates" },
  },
  date: { type: Date, default: Date.now, index: true },
  status: { type: String, enum: TRIP_STATUSES, default: "planned" },
}, { timestamps: true });

// Prevent overlapping live groups even when concurrent requests pass prechecks.
tripSchema.index({ shipmentIds: 1 }, {
  unique: true,
  partialFilterExpression: { status: { $in: ["planned", "active"] } },
});

module.exports = mongoose.model("Trip", tripSchema);
