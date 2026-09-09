const { body } = require("express-validator");
const { USER_ROLES } = require("../utils/constants");

const emailValidator = () => body("email")
  .isString().withMessage("Valid email is required").bail()
  .trim().isEmail().withMessage("Valid email is required").bail()
  .normalizeEmail({
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
    icloud_remove_subaddress: false,
    gmail_convert_googlemaildotcom: false,
  });

const registerValidators = [
  body().custom(value => value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).every(key => ["name", "email", "password", "role"].includes(key)))
    .withMessage("Only name, email, password, and role are accepted"),
  body("name").isString().withMessage("Name is required").bail()
    .trim().isLength({ min: 2, max: 100 }).withMessage("Name must contain 2 to 100 characters"),
  emailValidator(),
  body("password").isString().withMessage("Password is required").bail()
    .isLength({ min: 8 }).withMessage("Password must contain at least 8 characters").bail()
    // bcrypt only uses the first 72 bytes; reject passwords it would truncate.
    .custom(value => Buffer.byteLength(value, "utf8") <= 72).withMessage("Password must not exceed 72 UTF-8 bytes"),
  body("role").optional().isString().withMessage("Role must be customer or driver").bail()
    .isIn([USER_ROLES.CUSTOMER, USER_ROLES.DRIVER]).withMessage("Public registration only allows customer or driver"),
];

const loginValidators = [
  body().custom(value => value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).every(key => ["email", "password"].includes(key)))
    .withMessage("Only email and password are accepted"),
  emailValidator(),
  body("password").isString().withMessage("Password is required").bail()
    .notEmpty().withMessage("Password is required").bail()
    .custom(value => Buffer.byteLength(value, "utf8") <= 72).withMessage("Password must not exceed 72 UTF-8 bytes"),
];

module.exports = { registerValidators, loginValidators };
