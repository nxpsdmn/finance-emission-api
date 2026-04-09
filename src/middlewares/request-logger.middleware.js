const logger = require("../config/logger");

module.exports = (req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
};
