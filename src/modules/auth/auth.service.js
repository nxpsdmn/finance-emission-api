const env = require("../../config/env");
const { AppError } = require("../../config/errors");
const repository = require("./auth.repository");
const { 
	validateRegisterPayload,
	validateLoginPayload
} = require("./auth.validator");

const parseNxstartResponseBody = async (response) => {
	const contentType = response.headers.get("content-type") || "";

	if (contentType.includes("application/json")) {
		return response.json();
	}

	const text = await response.text();
	return { message: text };
};

const extractNxStartData = (body = {}) => {
	const nxstartUserId = body?.data?.user?.userId;
	const status = body?.data?.user?.status;
	const accessToken = body?.data?.accessToken;
	const refreshTokenExpiresAt = body?.data?.refreshTokenExpiresAt;

	if (!nxstartUserId || !accessToken || !refreshTokenExpiresAt || !status) {
		throw new AppError(
			"NxStart register response is missing required fields.", 502, { required: ["data.user.userId", "data.accessToken", "data.refreshTokenExpiresAt", "data.user.status"] }
		);
	}

	return {
		nxstartUserId: String(nxstartUserId),
		accessToken: String(accessToken),
		refreshTokenExpiresAt: new Date(refreshTokenExpiresAt),
		isActive: status == "active"
	};
};

// Register
const register = async (payload) => {
  	validateRegisterPayload(payload);

	if (!env.nxStartRegisterUrl)
		throw new AppError("NXSTART_REGISTER_URL is not configured in the environment.", 500);

	let response;
	try {
		response = await fetch(env.nxStartRegisterUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name: payload.name,
				username: payload.username,
				email: payload.email,
				password: payload.password,
				confirmPassword: payload.confirmPassword,
				purpose: payload.purpose,
				role: payload.role,
			}),
		});
	} catch (error) {
		throw new AppError(
			"Failed to call NxStart register endpoint.", 502, { "error": error.message }
		);
	}

	const responseBody = await parseNxstartResponseBody(response);
	if (!response.ok) {
		throw new AppError(
			responseBody?.message || responseBody?.error || "NxStart registration failed.",
			response.status || 502,
			responseBody
		);
	}

	const { nxstartUserId, accessToken, refreshTokenExpiresAt, isActive } = extractNxStartData(responseBody);

	if (!isActive)
		throw new AppError("The user status is NOT active.", 502);

	if (Number.isNaN(refreshTokenExpiresAt.getTime()))
		throw new AppError("NxStart returned an invalid refreshTokenExpiresAt value.", 502);

	let persistedUser;
	try {
		persistedUser = await repository.createUserByNxStartId({
			nxstartUserId,
			accessToken,
			refreshTokenExpiresAt,
		});
	} catch (error) {
		if (error?.code === 11000) {
			throw new AppError("User already exists.", 409);
		}
		throw error;
	}

	return {
		nxstart_user_id: persistedUser.nxstart_user_id,
		accessToken: persistedUser.accessToken,
		refreshTokenExpiresAt: persistedUser.refreshTokenExpiresAt,
	};
};

// Login
const login = async (payload) => {
	validateLoginPayload(payload);

	if (!env.nxStartLoginUrl)
		throw new AppError("NXSTART_LOGIN_URL is not configured in the environment.", 500);

	const requestBody = {
		usernameOrEmail: payload.usernameOrEmail,
		password: payload.password
	};

	let response;
	try {
		response = await fetch(env.nxStartLoginUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(requestBody)
		});
	} catch (error) {
		throw new AppError(
			"Failed to call NxStart login endpoint.", 502, { error: error.message }
		);
	}

	const responseBody = await parseNxstartResponseBody(response);
	if (!response.ok) {
		throw new AppError(
			responseBody?.message || responseBody?.error || "NxStart login failed.",
			response.status || 502,
			responseBody
		);
	}

  	const { nxstartUserId, accessToken, refreshTokenExpiresAt, isActive } = extractNxStartData(responseBody);

	if (!isActive)
		throw new AppError("The user status is NOT active.", 502);

	if (Number.isNaN(refreshTokenExpiresAt.getTime()))
		throw new AppError("NxStart returned an invalid refreshTokenExpiresAt value.", 502);

	const persistedUser = await repository.updateUserTokensByNxStartId({
		nxstartUserId,
		accessToken,
		refreshTokenExpiresAt,
	});

	if (!persistedUser) {
		throw new AppError("User does not exist in Finance Emission DB. Please register first.", 404);
	}

	return {
		nxstart_user_id: persistedUser.nxstart_user_id,
		accessToken: persistedUser.accessToken,
		refreshTokenExpiresAt: persistedUser.refreshTokenExpiresAt,
	};
};

// Logout
const logout = async ({ accessToken } = {}) => {
	if (!env.nxStartLogoutUrl)
		throw new AppError("NXSTART_LOGOUT_URL is not configured in the environment.", 500);

	if (!accessToken)
		throw new AppError("Authorization bearer token is required for logout.", 401);

	const user = await repository.findUserByAccessToken(accessToken);
	if (!user?.nxstart_user_id)
		throw new AppError("No user found for the provided access token.", 404);

	const nxStartUserId = user.nxstart_user_id;

	let response;
	try {
		response = await fetch(env.nxStartLogoutUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`,
			}
		});
	} catch (error) {
		throw new AppError(
			"Failed to call NxStart logout endpoint.", 502, { error: error.message }
		);
	}

	const responseBody = await parseNxstartResponseBody(response);
	if (!response.ok) {
		throw new AppError(
			responseBody?.message || responseBody?.error || "NxStart logout failed.",
			response.status || 502,
			responseBody
		);
	}

	await repository.clearUserTokensByNxStartId(nxStartUserId);
	return "success";
};

module.exports = {
  	register,
	login,
	logout,
};
