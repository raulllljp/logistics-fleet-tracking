const mongoose = require("mongoose");
const { USER_ROLES } = require("../utils/constants");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
  },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: Object.values(USER_ROLES), default: USER_ROLES.CUSTOMER },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
