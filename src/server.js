const app = require("./app");
const env = require("./config/env");
const logger = require("./config/logger");
const { connectDatabase } = require("./config/db");

const start = async () => {
  	try {
		await connectDatabase();
		app.listen(env.port, () => {
			logger.info(`Finance Emission API listening on port ${env.port}`);
		});
  	} catch (error) {
		logger.error("Failed to start service", error);
		process.exit(1);
  	}
};

start();
