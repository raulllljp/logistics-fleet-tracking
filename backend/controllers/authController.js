const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { USER_ROLES } = require("../utils/constants");

const publicUser = user => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const register = async (req, res, next) => {
  try {
    const { name, password, role = USER_ROLES.CUSTOMER } = req.body;
    const email = req.body.email.trim().toLowerCase();
    if (![USER_ROLES.CUSTOMER, USER_ROLES.DRIVER].includes(role)) {
      return res.status(403).json({ success: false, message: "Public registration only allows customer or driver", errorCode: "FORBIDDEN_ROLE" });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: "Email is already registered", errorCode: "EMAIL_ALREADY_EXISTS" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = new User({ name, email, passwordHash, role });
    // Check token configuration before persisting an account.
    const token = generateToken(user._id, user.role);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user: publicUser(user), token },
    });
  } catch (error) {
    // The unique index also handles concurrent registrations of the same email.
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email is already registered", errorCode: "EMAIL_ALREADY_EXISTS" });
    }
    error.expose = false;
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid email or password", errorCode: "INVALID_CREDENTIALS" });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account is inactive", errorCode: "ACCOUNT_INACTIVE" });
    }
    const token = generateToken(user._id, user.role);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user: publicUser(user), token },
    });
  } catch (error) {
    error.expose = false;
    next(error);
  }
};

const getMe = (req, res) => res.status(200).json({
  success: true,
  data: { user: { ...publicUser(req.user), isActive: req.user.isActive } },
});

module.exports = { register, login, getMe };
