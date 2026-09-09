const { validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errorCode: "VALIDATION_ERROR",
      errors: errors.array({ onlyFirstError: true }).map(error => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }
  next();
};

module.exports = validateRequest;
