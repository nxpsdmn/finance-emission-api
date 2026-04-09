const { fail } = require("../config/response");
const logger = require("../config/logger");

module.exports = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  logger.error("Request failed", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: error.message,
  });

  res.status(statusCode).json(fail(error.message || "Internal Server Error", error.details));
};
