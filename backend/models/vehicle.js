const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            trim: true
        },

        capacity: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: ["available", "assigned", "maintenance"],
            default: "available"
        },

        currentDriverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            default: null
        }
    },
    {
        timestamps: true
    }
);

vehicleSchema.index({ currentDriverId: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);