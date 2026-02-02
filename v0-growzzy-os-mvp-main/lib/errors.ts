export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: any,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export const ERRORS = {
  UNAUTHORIZED: new AppError("UNAUTHORIZED", 401, "Unauthorized access"),
  FORBIDDEN: new AppError("FORBIDDEN", 403, "Forbidden"),
  NOT_FOUND: new AppError("NOT_FOUND", 404, "Resource not found"),
  BAD_REQUEST: new AppError("BAD_REQUEST", 400, "Bad request"),
  INTERNAL_ERROR: new AppError("INTERNAL_ERROR", 500, "Internal server error"),
  OAUTH_FAILED: new AppError("OAUTH_FAILED", 500, "OAuth authentication failed"),
  DATABASE_ERROR: new AppError("DATABASE_ERROR", 500, "Database operation failed"),
  AI_ERROR: new AppError("AI_ERROR", 500, "AI service error"),
}

export function handleError(error: any) {
  if (error instanceof AppError) {
    return error
  }

  console.error("[v0] Unexpected error:", error)

  if (error?.code === "PGRST") {
    return new AppError("DATABASE_ERROR", 500, "Database operation failed", error)
  }

  return ERRORS.INTERNAL_ERROR
}
