const financeService = require("./finance.service");

const normalizeIp = (ipAddress) => {
  if (!ipAddress) {
    return undefined;
  }

  return ipAddress.startsWith("::ffff:") ? ipAddress.slice(7) : ipAddress;
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const firstIp = forwarded
      .split(",")
      .map((ip) => ip.trim())
      .find(Boolean);

    if (firstIp) {
      return normalizeIp(firstIp);
    }
  }

  return normalizeIp(
    req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress
  );
};

const createFinanceRawLogMiddleware = (apiType) => (req, res, next) => {
  const timestampRequest = new Date();
  let logged = false;

  const finalize = async () => {
    if (logged || !req.auth) {
      return;
    }

    logged = true;
    res.removeListener("finish", finalize);
    res.removeListener("close", finalize);

    try {
      await financeService.recordApiLog({
        apiType,
        auth: req.auth,
        ipAddress: getClientIp(req),
        responseStatus: res.statusCode,
        method: req.method,
        endpoint: req.originalUrl,
        timestampRequest,
        timestampResponse: new Date(),
      });
    } catch (error) {
      // Swallow logging failures to avoid affecting the response lifecycle.
    }
  };

  res.on("finish", finalize);
  res.on("close", finalize);

  next();
};

module.exports = {
  createFinanceRawLogMiddleware,
};
