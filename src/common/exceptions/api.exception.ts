import { HttpException, HttpStatus } from "@nestjs/common";

type ApiErrorBody = {
  error: {
    code:
      | "validation_error"
      | "not_found"
      | "conflict"
      | "forbidden"
      | "unauthorized"
      | "invalid_transition"
      | "service_unavailable"
      | "rate_limited"
      | "internal_error";
    message: string;
    field?: string;
  };
};

export class ApiException extends HttpException {
  constructor(
    status: number,
    code: ApiErrorBody["error"]["code"],
    message: string,
    field?: string,
  ) {
    super(
      {
        error: {
          code,
          message,
          ...(field ? { field } : {}),
        },
      } satisfies ApiErrorBody,
      status,
    );
  }

  static validation(message: string, field?: string): ApiException {
    return new ApiException(
      HttpStatus.BAD_REQUEST,
      "validation_error",
      message,
      field,
    );
  }

  static notFound(message: string): ApiException {
    return new ApiException(HttpStatus.NOT_FOUND, "not_found", message);
  }

  static conflict(message: string, field?: string): ApiException {
    return new ApiException(HttpStatus.CONFLICT, "conflict", message, field);
  }

  static forbidden(message: string): ApiException {
    return new ApiException(HttpStatus.FORBIDDEN, "forbidden", message);
  }

  static unauthorized(message: string): ApiException {
    return new ApiException(HttpStatus.UNAUTHORIZED, "unauthorized", message);
  }

  static invalidTransition(message: string): ApiException {
    return new ApiException(HttpStatus.CONFLICT, "invalid_transition", message);
  }

  static serviceUnavailable(message: string): ApiException {
    return new ApiException(
      HttpStatus.SERVICE_UNAVAILABLE,
      "service_unavailable",
      message,
    );
  }

  static rateLimited(message: string): ApiException {
    return new ApiException(HttpStatus.TOO_MANY_REQUESTS, "rate_limited", message);
  }
}
