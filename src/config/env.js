const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
	path: process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), ".env"),
});

const env = {
	nodeEnv: process.env.NODE_ENV || "development",
	port: Number(process.env.PORT || 4010),

	mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finance_emission_api",
	
	authMode: process.env.AUTH_MODE || "jwt",
	
	nxstartJwtSecret: process.env.NXSTART_JWT_SECRET || "",
	nxstartContextHeader: (process.env.NXSTART_CONTEXT_HEADER || "x-auth-context").toLowerCase(),
	
	logLevel: process.env.LOG_LEVEL || "info",
	
	collectionNames: {
		financeProjects: process.env.FINANCE_PROJECT_COLLECTION || "finance_projects",
		financeRawLogs: process.env.FINANCE_RAW_LOG_COLLECTION || "finance_raw_logs",
		dataQualityScores: process.env.FINANCE_DATA_QUALITY_COLLECTION || "data_quality_scores",
		cities: process.env.FINANCE_CITY_COLLECTION || "cities",
		euiDatas: process.env.FINANCE_EUI_COLLECTION || "eui_datas",
		users: process.env.FINANCE_USER_COLLECTION || "users",
	},

	trustProxy: process.env.TRUST_PROXY === "true",

	nxStartRegisterUrl: process.env.NXSTART_REGISTER_URL || "",
	nxStartLoginUrl: process.env.NXSTART_LOGIN_URL || "",
	nxStartLogoutUrl: process.env.NXSTART_LOGOUT_URL || "",

	sessionSecret: process.env.SESSION_SECRET || "",
	sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS || 7200),
	sessionCookieName: process.env.SESSION_COOKIE_NAME || "fe_sid",
	sessionCookieSecure: process.env.SESSION_COOKIE_SECURE === "true",
};

module.exports = env;
