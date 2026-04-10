const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { AppError } = require("../config/errors");
const mapNxstartClaims = require("../integrations/nxstart/nxstart-claims.mapper");
const authRepository = require("../modules/auth/auth.repository");

const parseHeaderContext = (headerValue) => {
	try {
		return JSON.parse(headerValue);
	} catch (error) {
		throw new AppError("Invalid auth context header JSON.", 401);
	}
};

const resolveClaims = async (req) => {
	if (env.authMode === "header") {
		const headerValue = req.headers[env.nxstartContextHeader];
		if (!headerValue) {
			throw new AppError("Missing auth context header.", 401);
		}
		return parseHeaderContext(headerValue);
	}

	const authorization = req.headers.authorization;
	if (!authorization || !authorization.startsWith("Bearer "))
		throw new AppError("Missing bearer token.", 401);

	if (!env.nxstartJwtSecret)
		throw new AppError("JWT auth is enabled but NXSTART_JWT_SECRET is not configured.", 500);

	const token = authorization.slice("Bearer ".length);
	if (!token)
		throw new AppError("Missing bearer token", 401);

	let claims;
	try {
		claims = jwt.verify(token, env.nxstartJwtSecret);
	} catch (error) {
		if (error.name === "TokenExpiredError")
			throw new AppError("Bearer token has expired.", 401);
    	if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError")
      		throw new AppError("Invalid bearer token.", 401);
    	throw error;
	}

	const tokenOwner = await authRepository.findUserByAccessToken(token);
  	if (!tokenOwner)
    	throw new AppError("Bearer token is not associated with an active user session.", 401);

  	return claims;
};

module.exports = async (req, res, next) => {
	try {
		// Optional: if you want session to bypass bearer check, keep this block.
		// If you want strict bearer-only checks, remove this block.
		// if (req.session?.auth?.nxstart_user_id) {
		// 	req.auth = {
		// 		subject: req.session.auth.nxstart_user_id,
		// 		raw: req.session.auth
		// 	};
		// 	return next();
		// }

		const claims = await resolveClaims(req);
		req.auth = mapNxstartClaims(claims);
		next();
	} catch (error) {
		next(error);
	}
};
