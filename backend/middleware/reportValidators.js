const { query } = require("express-validator");

const dateBound = (value, end = false) => {
  const date = new Date(value);
  if (end && /^\d{4}-\d{2}-\d{2}$/.test(value)) date.setUTCHours(23, 59, 59, 999);
  return date;
};
const reportValidators = [
  ...["from", "to"].map(field => query(field).optional().isString().bail()
    .isISO8601({ strict: true }).withMessage(`${field} must be a valid ISO date`).bail()
    .custom(value => /^\d{4}-\d{2}-\d{2}$/.test(value) || /(?:Z|[+-]\d{2}:\d{2})$/i.test(value))
    .withMessage("Use a date-only value or a timestamp with an explicit timezone").bail()
    .custom(value => Number.isFinite(dateBound(value).getTime())).withMessage("Invalid date")),
  query("to").optional().custom((value, { req }) => {
    if (!req.query.from) return true;
    const from = dateBound(req.query.from), to = dateBound(value, true);
    return !Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from <= to;
  }).withMessage("from must not be later than to"),
];
module.exports = { reportValidators, dateBound };
