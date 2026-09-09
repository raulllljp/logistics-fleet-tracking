const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const unauthorized = res => res.status(401).json({
  success: false,
  message: "Authentication required",
  errorCode: "UNAUTHORIZED",
});

const authMiddleware = async (req, res, next) => {
  const match = /^Bearer ([^\s]+)$/i.exec(req.get("Authorization") || "");
  if (!match) return unauthorized(res);

  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured");
    error.expose = false;
    return next(error);
  }

  let payload;
  try {
    payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!payload || typeof payload.userId !== "string" || !mongoose.isObjectIdOrHexString(payload.userId)) {
      return unauthorized(res);
    }
  } catch {
    return unauthorized(res);
  }

  try {
    const user = await User.findById(payload.userId).select("-passwordHash");
    if (!user || !user.isActive) return unauthorized(res);
    req.user = user;
    return next();
  } catch (error) {
    error.expose = false;
    return next(error);
  }
};

module.exports = authMiddleware;
