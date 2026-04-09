const logger = require("../../config/logger");

const recordAuditEvent = async (payload) => {
  logger.info("audit-event", payload);
};

module.exports = {
  recordAuditEvent,
};
