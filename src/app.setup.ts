import { INestApplication, ValidationError, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ApiException } from './common/exceptions/api.exception';
import { TrimInputPipe } from './common/pipes/trim-input.pipe';

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
  const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`), false);
    },
    credentials: true
  });
  app.useGlobalPipes(
    new TrimInputPipe(),
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
