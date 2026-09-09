const jwt = require("jsonwebtoken");

const generateToken = (userId, role) => {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured");
    error.expose = false;
    throw error;
  }

  const payload = { userId: String(userId) };
  if (role !== undefined) payload.role = role;

  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
  } catch (error) {
    error.expose = false;
    throw error;
  }
};

module.exports = generateToken;
