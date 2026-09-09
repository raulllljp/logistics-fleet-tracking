const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validationMiddleware");
const { registerValidators, loginValidators } = require("../middleware/authValidators");

const router = express.Router();

router.post("/register", registerValidators, validateRequest, register);
router.post("/login", loginValidators, validateRequest, login);
router.get("/me", authMiddleware, getMe);

module.exports = router;
