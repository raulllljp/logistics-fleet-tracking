const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validationMiddleware");
const { USER_ROLES } = require("../utils/constants");
const { createShipmentValidators, estimateValidators, myShipmentValidators, allShipmentValidators, validateShipmentId } = require("../middleware/shipmentValidators");
const { estimateShipment, createShipment, getMyShipments, getAllShipments, getShipmentById } = require("../controllers/shipmentController");

const router = express.Router();
const { getDeliveryProof, trackShipment } = require("../controllers/shipmentController");
const { statusUpdateValidators, driverShipmentValidators } = require("../middleware/shipmentValidators");
const { updateShipmentStatusController, getDriverShipments, getShipmentHistory } = require("../controllers/shipmentController");
const { assignmentValidators } = require("../middleware/shipmentValidators");
const { assignShipmentController } = require("../controllers/shipmentController");
router.use(authMiddleware);
router.put("/:id/assign", authorizeRoles(USER_ROLES.DISPATCHER, USER_ROLES.ADMIN), validateShipmentId, assignmentValidators, validateRequest, assignShipmentController);
router.post("/estimate", authorizeRoles(USER_ROLES.CUSTOMER), estimateValidators, validateRequest, estimateShipment);
router.post("/", authorizeRoles(USER_ROLES.CUSTOMER), createShipmentValidators, validateRequest, createShipment);
router.get("/my", authorizeRoles(USER_ROLES.CUSTOMER), myShipmentValidators, validateRequest, getMyShipments);
router.get("/", authorizeRoles(USER_ROLES.DISPATCHER, USER_ROLES.ADMIN), allShipmentValidators, validateRequest, getAllShipments);
router.get("/driver/my", authorizeRoles(USER_ROLES.DRIVER), driverShipmentValidators, validateRequest, getDriverShipments);
router.put("/:id/status", authorizeRoles(USER_ROLES.DRIVER), validateShipmentId, statusUpdateValidators, validateRequest, updateShipmentStatusController);
router.get("/:id/history", authorizeRoles(...Object.values(USER_ROLES)), validateShipmentId, getShipmentHistory);
router.get("/:id/track", authorizeRoles(USER_ROLES.CUSTOMER), validateShipmentId, trackShipment);
router.get("/track/:id", authorizeRoles(USER_ROLES.CUSTOMER), validateShipmentId, trackShipment);
router.get("/:id/proof", authorizeRoles(...Object.values(USER_ROLES)), validateShipmentId, getDeliveryProof);
router.get("/:id/pod", authorizeRoles(...Object.values(USER_ROLES)), validateShipmentId, getDeliveryProof);
router.post("/:id/pod", authorizeRoles(USER_ROLES.DRIVER), validateShipmentId, (req, res, next) => {
  req.body.status = "DELIVERED";
  next();
}, statusUpdateValidators, validateRequest, updateShipmentStatusController);
router.get("/:id", authorizeRoles(USER_ROLES.CUSTOMER, USER_ROLES.DISPATCHER, USER_ROLES.ADMIN), validateShipmentId, getShipmentById);

module.exports = router;
