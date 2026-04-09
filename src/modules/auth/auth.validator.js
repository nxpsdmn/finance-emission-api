const { AppError } = require("../../config/errors");

const REQUIRED_FIELDS = [
	"name", 
	"username", 
	"email", 
	"password", 
	"confirmPassword", 
	"purpose", 
	"role"
];

const validateRegisterPayload = (payload = {}) => {
	const missing = REQUIRED_FIELDS.filter((field) => {
		const value = payload[field];
		return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
	});

	if (missing.length > 0)
		throw new AppError(`Missing required fields: ${missing.join(", ")}`);

  	if (payload.password !== payload.confirmPassword)
    	throw new AppError("password and confirmPassword do not match.");
};

const validateLoginPayload = (payload = {}) => {
	const hasUsernameOrEmail = typeof payload.usernameOrEmail === "string" && payload.usernameOrEmail.trim() !== "";
	const hasPassword = typeof payload.password === "string" && payload.password.trim() !== "";

	if (!hasUsernameOrEmail || !hasPassword)
		throw new AppError("Missing required fields: usernameOrEmail or password");
};

module.exports = {
  	validateRegisterPayload,
	validateLoginPayload,
};
