const { ok } = require("../../config/response");
const env = require("../../config/env");
const authService = require("./auth.service");

const register = async (req, res, next) => {
	try {
		const result = await authService.register(req.body);

		// set session after successful register/login
		req.session.auth = {
			nxstart_user_id: result.nxstart_user_id,
			accessToken: result.accessToken,
			refreshTokenExpiresAt: result.refreshTokenExpiresAt
		};

		res.json(ok(result));
	} catch (error) {
		next(error);
	}
};

const login = async (req, res, next) => {
	try {
		const result = await authService.login(req.body);

		// set session after successful register/login
		req.session.auth = {
			nxstart_user_id: result.nxstart_user_id,
			accessToken: result.accessToken,
			refreshTokenExpiresAt: result.refreshTokenExpiresAt,
		};

		res.json(ok(result));
	} catch (error) {
		next(error);
	}
};

const logout = (req, res, next) => {
	const authorization = req.headers.authorization || "";
	const bearerPrefix = "Bearer ";
	const accessToken = authorization.startsWith(bearerPrefix)
		? authorization.slice(bearerPrefix.length).trim()
		: "";

	const completeLogout = () => {
		res.clearCookie(env.sessionCookieName);
		return res.json(ok("success"));
	};

	if (!req.session) {
		authService
			.logout({ accessToken })
			.then(completeLogout)
			.catch(next);
		return;
	}

	authService
		.logout({ accessToken })
		.then(() => {
			req.session.destroy((error) => {
				if (error) {
					return next(error);
				}
				return completeLogout();
			});
		})
		.catch(next);
};

module.exports = {
  	register,
	login,
	logout,
};
