const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
    {
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true
        },

        shipmentIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Shipment"
            }
        ],

        date: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Trip", tripSchema);