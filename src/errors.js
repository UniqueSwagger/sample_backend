// Errors raised by services/domain. The error handler in app.js turns
// them into RFC 9457 problem+json responses.
class AppError extends Error {
  constructor(status, title, detail, type, errors) {
    super(detail);
    this.status = status;
    this.title = title;
    this.type = type;
    this.errors = errors;
  }
}

class ValidationFailed extends AppError {
  constructor(errors) {
    super(422, "Validation failed", "One or more fields are invalid", "validation-failed", errors);
  }
}

class NotFound extends AppError {
  constructor(detail = "Resource not found") {
    super(404, "Resource not found", detail, "not-found");
  }
}

class Conflict extends AppError {
  constructor(detail) {
    super(409, "Request conflicts with current state", detail, "conflict");
  }
}

module.exports = { AppError, ValidationFailed, NotFound, Conflict };
