const mongoose = require("mongoose");
const { SHIPMENT_STATUSES } = require("../utils/constants");

const statusHistorySchema = new mongoose.Schema({
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true },
  status: { type: String, enum: SHIPMENT_STATUSES, required: true },
  timestamp: { type: Date, default: Date.now },
  location: { type: String, trim: true },
  note: { type: String, trim: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Also supports shipment-only lookups through the leading index field.
statusHistorySchema.index({ shipmentId: 1, timestamp: 1 });

module.exports = mongoose.model("StatusHistory", statusHistorySchema);
