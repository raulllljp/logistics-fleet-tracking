const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
    {
        shipmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shipment",
            required: true
        },

        status: {
            type: String,
            enum: [
                "booked",
                "assigned",
                "picked-up",
                "in-transit",
                "delivered",
                "failed"
            ],
            required: true
        },

        timestamp: {
            type: Date,
            default: Date.now
        },

        note: {
            type: String,
            default: "",
            trim: true
        }
    }
);

statusHistorySchema.index({ shipmentId: 1 });

module.exports = mongoose.model(
    "StatusHistory",
    statusHistorySchema
);