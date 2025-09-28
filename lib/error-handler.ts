/**
 * Centralized error handling utilities
 * Provides consistent error handling across the application
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409);
  }
}

/**
 * Safe error handler that prevents sensitive information leakage
 */
export function handleError(error: unknown): { message: string; statusCode: number } {
  // Log the full error for debugging (in production, use proper logging service)
  console.error("Error occurred:", error);

  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // In production, don't expose internal error details
    if (process.env.NODE_ENV === "production") {
      return {
        message: "An unexpected error occurred. Please try again later.",
        statusCode: 500,
      };
    }

    return {
      message: error.message,
      statusCode: 500,
    };
  }

  return {
    message: "An unexpected error occurred. Please try again later.",
    statusCode: 500,
  };
}

/**
 * Async error wrapper for server actions
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<{ success: true; data: R } | { success: false; error: string }> => {
    try {
      const data = await fn(...args);
      return { success: true, data };
    } catch (error) {
      const { message } = handleError(error);
      return { success: false, error: message };
    }
  };
}

/**
 * Validation helper
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === "") {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }
}

export function validateAmount(amount: number): void {
  if (isNaN(amount) || amount < 0) {
    throw new ValidationError("Amount must be a positive number");
  }
}
