const mongoose = require("mongoose");
const Shipment = require("../models/Shipment");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const StatusHistory = require("../models/StatusHistory");
const { ACTIVE_SHIPMENT_STATUSES } = require("../utils/constants");

const TRANSITIONS = {
  BOOKED: ["ASSIGNED"],
  ASSIGNED: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: [],
};
const DRIVER_STATUSES = ["PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"];
const isValidTransition = (current, next) => Object.hasOwn(TRANSITIONS, current)
  && TRANSITIONS[current].includes(next);
const reject = (statusCode, errorCode, message) => {
  throw Object.assign(new Error(message), { statusCode, errorCode });
};

const updateShipmentStatus = ({ shipmentId, userId, status, location, note, receiverName, deliveryNotes }) =>
  mongoose.connection.transaction(async session => {
    const driver = await Driver.findOne({ userId }).session(session);
    if (!driver) reject(404, "DRIVER_PROFILE_NOT_FOUND", "Driver profile not found");
    const shipment = await Shipment.findById(shipmentId).session(session);
    if (!shipment) reject(404, "SHIPMENT_NOT_FOUND", "Shipment not found");
    if (!shipment.assignedDriverId?.equals(driver._id)) {
      reject(403, "SHIPMENT_NOT_ASSIGNED_TO_DRIVER", "Shipment is not assigned to this driver");
    }
    if (!DRIVER_STATUSES.includes(status) || !isValidTransition(shipment.status, status)) {
      reject(409, "INVALID_STATUS_TRANSITION", "Invalid shipment status transition");
    }
    if (!shipment.assignedVehicleId) reject(409, "ASSIGNED_VEHICLE_NOT_FOUND", "Shipment has no assigned vehicle");

    const timestamp = new Date();
    if (status === "DELIVERED") {
      if (typeof receiverName !== "string" || receiverName.trim().length < 2 || receiverName.trim().length > 100) {
        reject(400, "DELIVERY_RECEIVER_REQUIRED", "A receiver name of 2 to 100 characters is required");
      }
      shipment.deliveryProof = { receiverName: receiverName.trim(), deliveryNotes, deliveredAt: timestamp };
    }
    shipment.status = status;
    await shipment.save({ session });
    const history = new StatusHistory({
      shipmentId: shipment._id, status, timestamp, location, note, updatedBy: userId,
    });
    await history.save({ session });

    if (status === "DELIVERED" || status === "FAILED") {
      const vehicle = await Vehicle.findById(shipment.assignedVehicleId).session(session);
      if (!vehicle) reject(409, "ASSIGNED_VEHICLE_NOT_FOUND", "Assigned vehicle not found");
      const otherWork = await Shipment.exists({
        _id: { $ne: shipment._id }, assignedVehicleId: vehicle._id,
        status: { $in: ACTIVE_SHIPMENT_STATUSES },
      }).session(session);
      // Availability is an explicit dispatcher-managed flag; completion must
      // not undo a pause. Serialize resource release with concurrent dispatch.
      await Vehicle.updateOne({ _id: vehicle._id }, {
        $set: { status: otherWork ? "assigned" : "available" }, $inc: { __v: 1 },
      }, { session });
    }
    return shipment;
  });

module.exports = { isValidTransition, DRIVER_STATUSES, updateShipmentStatus };
