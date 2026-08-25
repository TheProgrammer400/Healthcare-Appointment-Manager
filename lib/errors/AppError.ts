export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'APPOINTMENT_CONFLICT'
  | 'EMAIL_TAKEN'
  | 'DOCTOR_ON_LEAVE'
  | 'LEAVE_ALREADY_EXISTS'
  | 'RATE_LIMITED'
  | 'LLM_UNAVAILABLE'
  | 'CALENDAR_UNAVAILABLE'
  | 'EMAIL_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: ErrorCode, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHENTICATED');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', code: ErrorCode = 'APPOINTMENT_CONFLICT') {
    super(message, 409, code);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, 429, 'RATE_LIMITED');
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, code: ErrorCode = 'LLM_UNAVAILABLE') {
    super(message, 502, code);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'An unexpected server error occurred') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}
