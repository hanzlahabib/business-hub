// Custom error classes for consistent API error handling

export class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = true
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404)
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Validation failed', fields = {}) {
        super(message, 422)
        this.fields = fields
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401)
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409)
    }
}
