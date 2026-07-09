import { INestApplication, ValidationError, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ApiException } from './common/exceptions/api.exception';

function flattenValidationErrors(errors: ValidationError[]): ValidationError | undefined {
  const [firstError] = errors;

  if (!firstError) {
    return undefined;
  }

  if (firstError.constraints) {
    return firstError;
  }

  return firstError.children ? flattenValidationErrors(firstError.children) : firstError;
}

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const error = flattenValidationErrors(errors);
        const message = error?.constraints ? Object.values(error.constraints)[0] : 'Validation failed.';
        throw ApiException.validation(message, error?.property);
      }
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
}

