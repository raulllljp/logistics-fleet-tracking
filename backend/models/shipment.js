const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        pickupAddress: {
            type: String,
            required: true,
            trim: true
        },

        dropAddress: {
            type: String,
            required: true,
            trim: true
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
            default: "booked"
        },

        assignedDriverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            default: null
        },

        cost: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

shipmentSchema.index({ customerId: 1 });

module.exports = mongoose.model("Shipment", shipmentSchema);