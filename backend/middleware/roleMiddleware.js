const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      errorCode: "UNAUTHORIZED",
    });
  }

  if (!req.user.role || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to perform this action",
      errorCode: "FORBIDDEN",
    });
  }

  return next();
};

module.exports = authorizeRoles;
