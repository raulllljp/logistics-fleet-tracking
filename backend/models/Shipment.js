const mongoose = require("mongoose");
const { SHIPMENT_STATUSES } = require("../utils/constants");

// Proof belongs only to this shipment and does not need its own document ID.
const deliveryProofSchema = new mongoose.Schema({
  receiverName: { type: String, trim: true },
  deliveryNotes: { type: String, trim: true },
  deliveredAt: Date,
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  pickupAddress: { type: String, required: true, trim: true },
  dropAddress: { type: String, required: true, trim: true },
  // Weight is in kilograms; distance is in kilometers.
  weight: {
    type: Number,
    required: true,
    validate: { validator: value => Number.isFinite(value) && value > 0, message: "Weight must be greater than zero" },
  },
  distance: { type: Number, required: true, min: 0, validate: Number.isFinite },
  status: { type: String, enum: SHIPMENT_STATUSES, default: "BOOKED", index: true },
  assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null, index: true },
  assignedVehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null, index: true },
  estimatedCost: { type: Number, min: 0, default: 0, validate: Number.isFinite },
  deliveryProof: { type: deliveryProofSchema, default: undefined },
  bookedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Shipment", shipmentSchema);
