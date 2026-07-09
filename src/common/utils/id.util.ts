import { randomUUID } from 'crypto';

export function createId(prefix: string, suffix?: string): string {
  if (suffix && suffix.length > 0) {
    return `${prefix}-${suffix}`;
  }

  return `${prefix}-${randomUUID()}`;
}
