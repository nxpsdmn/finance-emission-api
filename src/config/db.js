const mongoose = require("mongoose");
const env = require("./env");
const logger = require("./logger");

let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  await mongoose.connect(env.mongoUri);
  isConnected = true;
  logger.info("Connected to MongoDB");
  return mongoose.connection;
};

module.exports = {
  connectDatabase,
};
