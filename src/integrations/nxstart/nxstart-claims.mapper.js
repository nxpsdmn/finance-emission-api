const { AppError } = require("../../config/errors");

module.exports = (claims = {}) => {
	const authContext = {
		subject: claims.sub || claims.userId || claims.id,
		companyId: claims.companyId || claims.company_id || claims.orgId,
		companyKey: claims.companyKey || claims.company_key || claims.companyId || claims.company_id,
		email: claims.email || null,
		displayName: claims.displayName || claims.name || claims.preferred_username || null,
		roles: claims.roles || claims.permissions || [],
		raw: claims,
  	};

  	if (!authContext.subject) {
    	throw new AppError("Authenticated subject is missing from NxStart claims.", 401);
  	}

  	return authContext;
};
