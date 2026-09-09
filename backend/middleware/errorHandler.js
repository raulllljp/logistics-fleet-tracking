const notFound = (req, res) => {
	res.status(404).json({
		success: false,
		message: `Route not found: ${req.method} ${req.originalUrl}`,
		errorCode: "ROUTE_NOT_FOUND",
	});
};

const errorHandler = (error, req, res, next) => {
	if (res.headersSent) {
		return next(error);
	}
	// Normalize database failures without returning document values or internals.
	if (error.code === 11000 || error.name === "CastError" || error.name === "ValidationError") {
		const duplicate = error.code === 11000;
		return res.status(duplicate ? 409 : 400).json({
			success: false,
			message: duplicate ? "A record with these unique fields already exists" : "Invalid request data",
			errorCode: duplicate ? "DUPLICATE_RESOURCE" : "VALIDATION_ERROR",
		});
	}

	const requestedStatus = error.statusCode || error.status;
	const statusCode = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599
		? requestedStatus
		: 500;
	const isServerError = statusCode >= 500;
	const isInvalidJson = error.type === "entity.parse.failed";

	if (isServerError) {
		console.error(`Request failed: ${error.message || "Internal server error"}`);
	}

	const message = isInvalidJson
		? "Invalid JSON in request body"
		: error.expose === false || isServerError
			? "Internal server error"
			: error.message || "Request failed";

	res.status(statusCode).json({
		success: false,
		message,
		errorCode: isInvalidJson ? "INVALID_JSON" : isServerError ? "SERVER_ERROR" : error.errorCode || "REQUEST_ERROR",
	});
};

module.exports = { notFound, errorHandler };
