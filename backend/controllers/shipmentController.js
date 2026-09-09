const mongoose = require("mongoose");
const Shipment = require("../models/Shipment");
const StatusHistory = require("../models/StatusHistory");
const { USER_ROLES } = require("../utils/constants");
const { calculateShipmentCost } = require("../services/pricingService");
const { assignShipment } = require("../services/dispatchService");

const handleError = (error, next) => {
  if (!error.statusCode) error.expose = false;
  return next(error);
};

const estimateShipment = (req, res, next) => {
  try {
    const { weight, distance } = req.body;
    const estimatedCost = calculateShipmentCost(weight, distance);
    return res.json({ success: true, data: { weight, distance, estimatedCost } });
  } catch (error) { return handleError(error, next); }
};

const createShipment = async (req, res, next) => {
  try {
    const { pickupAddress, dropAddress, weight, distance } = req.body;
    const estimatedCost = calculateShipmentCost(weight, distance);
    const shipment = await mongoose.connection.transaction(async session => {
      const shipment = new Shipment({
        customerId: req.user._id, pickupAddress, dropAddress, weight, distance,
        status: "BOOKED", assignedDriverId: null, assignedVehicleId: null,
        estimatedCost, bookedAt: new Date(),
      });
      await shipment.save({ session });
      const history = new StatusHistory({
        shipmentId: shipment._id, status: "BOOKED", timestamp: shipment.bookedAt,
        updatedBy: req.user._id, note: "Shipment booked",
      });
      await history.save({ session });
      return shipment;
    });
    return res.status(201).json({ success: true, message: "Shipment booked successfully", data: { shipment } });
  } catch (error) { return handleError(error, next); }
};

const getMyShipments = async (req, res, next) => {
  try {
    const filter = { customerId: req.user._id };
    if (req.query.status !== undefined) filter.status = req.query.status;
    const shipments = await Shipment.find(filter).sort({ createdAt: -1, _id: -1 });
    return res.json({ success: true, count: shipments.length, data: { shipments } });
  } catch (error) { return handleError(error, next); }
};

const getAllShipments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status !== undefined) filter.status = req.query.status;
    if (req.query.customerId !== undefined) filter.customerId = req.query.customerId;
    const shipments = await Shipment.find(filter).sort({ createdAt: -1, _id: -1 })
      .populate("customerId", "name email");
    return res.json({ success: true, count: shipments.length, data: { shipments } });
  } catch (error) { return handleError(error, next); }
};

const getShipmentById = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found", errorCode: "SHIPMENT_NOT_FOUND" });
    if (req.user.role === USER_ROLES.CUSTOMER && !shipment.customerId.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "You do not have permission to perform this action", errorCode: "FORBIDDEN" });
    }
    return res.json({ success: true, data: { shipment } });
  } catch (error) { return handleError(error, next); }
};

const assignShipmentController = async (req, res, next) => {
  try {
    const shipment = await assignShipment({
      shipmentId: req.params.id, driverId: req.body.driverId,
      vehicleId: req.body.vehicleId, assignedByUserId: req.user._id,
    });
    return res.json({ success: true, message: "Shipment assigned successfully", data: { shipment } });
  } catch (error) { return handleError(error, next); }
};

const Driver = require("../models/Driver");
const { updateShipmentStatus } = require("../services/shipmentWorkflowService");

const updateShipmentStatusController = async (req, res, next) => {
  try {
    const { status, location, note, receiverName, deliveryNotes } = req.body;
    const shipment = await updateShipmentStatus({ shipmentId: req.params.id, userId: req.user._id, status, location, note, receiverName, deliveryNotes });
    return res.json({ success: true, message: "Shipment status updated successfully", data: { shipment } });
  } catch (error) { return handleError(error, next); }
};

const getDriverShipments = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found", errorCode: "DRIVER_PROFILE_NOT_FOUND" });
    const filter = { assignedDriverId: driver._id };
    if (req.query.status !== undefined) filter.status = req.query.status;
    const shipments = await Shipment.find(filter).sort({ createdAt: -1, _id: -1 });
    return res.json({ success: true, count: shipments.length, data: { shipments } });
  } catch (error) { return handleError(error, next); }
};

const getShipmentHistory = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found", errorCode: "SHIPMENT_NOT_FOUND" });
    if (req.user.role === USER_ROLES.CUSTOMER && !shipment.customerId.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied", errorCode: "FORBIDDEN" });
    }
    if (req.user.role === USER_ROLES.DRIVER) {
      const driver = await Driver.findOne({ userId: req.user._id });
      if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found", errorCode: "DRIVER_PROFILE_NOT_FOUND" });
      if (!shipment.assignedDriverId?.equals(driver._id)) {
        return res.status(403).json({ success: false, message: "Shipment is not assigned to this driver", errorCode: "SHIPMENT_NOT_ASSIGNED_TO_DRIVER" });
      }
    }
    const history = await StatusHistory.find({ shipmentId: shipment._id }).sort({ timestamp: 1, _id: 1 });
    return res.json({ success: true, data: { shipmentId: shipment._id, currentStatus: shipment.status, history } });
  } catch (error) { return handleError(error, next); }
};

const getDeliveryProof = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found", errorCode: "SHIPMENT_NOT_FOUND" });
    if (req.user.role === USER_ROLES.CUSTOMER && !shipment.customerId.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied", errorCode: "FORBIDDEN" });
    }
    if (req.user.role === USER_ROLES.DRIVER) {
      const driver = await Driver.findOne({ userId: req.user._id });
      if (!driver || !shipment.assignedDriverId?.equals(driver._id)) {
        return res.status(403).json({ success: false, message: "Shipment is not assigned to this driver", errorCode: "SHIPMENT_NOT_ASSIGNED_TO_DRIVER" });
      }
    }
    if (shipment.status !== "DELIVERED") return res.status(409).json({ success: false, message: "Delivery is not completed", errorCode: "DELIVERY_NOT_COMPLETED" });
    if (!shipment.deliveryProof?.receiverName || !shipment.deliveryProof.deliveredAt) {
      return res.status(404).json({ success: false, message: "Delivery proof not found", errorCode: "DELIVERY_PROOF_NOT_FOUND" });
    }
    return res.json({ success: true, data: { shipmentId: shipment._id, deliveryProof: shipment.deliveryProof } });
  } catch (error) { return handleError(error, next); }
};

const trackShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found", errorCode: "SHIPMENT_NOT_FOUND" });
    if (!shipment.customerId.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied", errorCode: "FORBIDDEN" });
    }
    await shipment.populate([
      { path: "assignedDriverId", select: "userId", populate: { path: "userId", select: "name" } },
      { path: "assignedVehicleId", select: "registrationNumber type" },
    ]);
    const history = await StatusHistory.find({ shipmentId: shipment._id })
      .select("status timestamp location note -_id").sort({ timestamp: 1, _id: 1 });
    const driver = shipment.assignedDriverId?.userId;
    const vehicle = shipment.assignedVehicleId;
    return res.json({ success: true, data: {
      shipment: {
        _id: shipment._id, pickupAddress: shipment.pickupAddress, dropAddress: shipment.dropAddress,
        weight: shipment.weight, distance: shipment.distance, estimatedCost: shipment.estimatedCost,
        currentStatus: shipment.status, bookedAt: shipment.bookedAt,
        driver: driver ? { name: driver.name } : null,
        vehicle: vehicle ? { registrationNumber: vehicle.registrationNumber, type: vehicle.type } : null,
      },
      history,
      deliveryProof: shipment.status === "DELIVERED" ? shipment.deliveryProof || null : null,
    } });
  } catch (error) { return handleError(error, next); }
};

module.exports = { estimateShipment, createShipment, getMyShipments, getAllShipments, getShipmentById, assignShipmentController, updateShipmentStatusController, getDriverShipments, getShipmentHistory, getDeliveryProof, trackShipment };
