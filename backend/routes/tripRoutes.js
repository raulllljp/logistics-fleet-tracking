const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validationMiddleware");
const { USER_ROLES } = require("../utils/constants");
const { createTripValidators, updateTripStatusValidators, tripFilterValidators, myTripValidators, validateTripId } = require("../middleware/tripValidators");
const { createTrip, getTrips, getTripById, getMyTrips, updateTripStatus } = require("../controllers/tripController");

const router = express.Router();
router.use(authMiddleware);
router.get("/my", authorizeRoles(USER_ROLES.DRIVER), myTripValidators, validateRequest, getMyTrips);
router.use(authorizeRoles(USER_ROLES.DISPATCHER, USER_ROLES.ADMIN));
router.post("/", createTripValidators, validateRequest, createTrip);
router.get("/", tripFilterValidators, validateRequest, getTrips);
router.put("/:id/status", validateTripId, updateTripStatusValidators, validateRequest, updateTripStatus);
router.get("/:id", validateTripId, getTripById);
module.exports = router;
