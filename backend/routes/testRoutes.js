const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { USER_ROLES } = require("../utils/constants");

const router = express.Router();

// Development reference only: intentionally NOT mounted by server.js.
// Real protected routes now provide RBAC coverage.
router.get("/customer", authMiddleware, authorizeRoles(USER_ROLES.CUSTOMER), (req, res) => {
  res.json({ success: true, message: "Customer access granted" });
});

router.get("/driver", authMiddleware, authorizeRoles(USER_ROLES.DRIVER), (req, res) => {
  res.json({ success: true, message: "Driver access granted" });
});

router.get("/operations", authMiddleware, authorizeRoles(USER_ROLES.DISPATCHER, USER_ROLES.ADMIN), (req, res) => {
  res.json({ success: true, message: "Operations access granted" });
});

router.get("/admin", authMiddleware, authorizeRoles(USER_ROLES.ADMIN), (req, res) => {
  res.json({ success: true, message: "Admin access granted" });
});

module.exports = router;
