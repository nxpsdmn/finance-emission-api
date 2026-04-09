const ok = (payload, meta) => ({
	success: true,
	error: false,
	payload: payload ?? null,
	meta: meta ?? null,
});

const fail = (message, details) => ({
	success: false,
	error: message,
	payload: null,
	details: details ?? null,
});

module.exports = {
	ok,
	fail,
};
