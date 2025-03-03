class APIError extends Error {
	constructor(status, message, isOperational = true) {
		super(message);
		// this.name = this.constructor.name;
		this.message = message;
		this.status = status;
		// this.isOperational = isOperational;
		// Error.captureStackTrace(this, this.constructor);
	}
}

export default APIError;
