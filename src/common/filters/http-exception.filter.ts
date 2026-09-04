import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if (exception instanceof QueryFailedError) {
      const driverError = exception.driverError as
        { code?: string } | undefined;

      if (driverError?.code === "23505") {
        response.status(HttpStatus.CONFLICT).json({
          error: {
            code: "conflict",
            message: "Unique constraint failed.",
          },
        });
        return;
      }
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: "internal_error",
        message: "Unexpected server error.",
      },
    });
  }
}
