const env = require("./env");

const shouldLog = (level) => {
  const weights = { error: 0, warn: 1, info: 2, debug: 3 };
  const current = weights[env.logLevel] ?? weights.info;
  return (weights[level] ?? weights.info) <= current;
};

const format = (level, args) => {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}]`, level.toUpperCase(), ...args];
};

const logger = {
  error: (...args) => {
    if (shouldLog("error")) {
      console.error(...format("error", args));
    }
  },
  warn: (...args) => {
    if (shouldLog("warn")) {
      console.warn(...format("warn", args));
    }
  },
  info: (...args) => {
    if (shouldLog("info")) {
      console.info(...format("info", args));
    }
  },
  debug: (...args) => {
    if (shouldLog("debug")) {
      console.debug(...format("debug", args));
    }
  },
};

module.exports = logger;
