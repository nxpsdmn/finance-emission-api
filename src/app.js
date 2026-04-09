const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const env = require("./config/env");
const routes = require("./routes");
const requestLoggerMiddleware = require("./middlewares/request-logger.middleware");
const errorHandlerMiddleware = require("./middlewares/error-handler.middleware");

if (!env.sessionSecret)
	throw new Error("SESSION_SECRET is required.");

const app = express();

if (env.trustProxy) {
	app.set("trust proxy", true);
}

// CORS + CSRF middleware
app.use(cors());
app.use(helmet());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use(requestLoggerMiddleware);

// Session Storage
app.use(
	session({
		name: env.sessionCookieName,
		secret: env.sessionSecret,
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl: env.mongoUri,
			ttl: env.sessionTtlSeconds,
			collectionName: "sessions"
		}),
		cookie: {
			httpOnly: true,
			sameSite: "lax",
			secure: env.sessionCookieSecure,
			maxAge: env.sessionTtlSeconds * 1000,
		}
	})
);

// Router
app.use(routes);

// Error-handling middleware
app.use(errorHandlerMiddleware);

module.exports = app;
