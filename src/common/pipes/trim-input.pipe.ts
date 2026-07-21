import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

function trimValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.map((item) => trimValue(item));
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, itemValue]) => [
        key,
        trimValue(itemValue)
      ])
    );
  }

  return value;
}

@Injectable()
export class TrimInputPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (!['body', 'query', 'param'].includes(metadata.type)) {
      return value;
    }

    return trimValue(value);
  }
}
