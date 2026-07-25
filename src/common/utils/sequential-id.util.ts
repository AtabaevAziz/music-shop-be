const UNIQUE_CONSTRAINT_ERROR_CODE = 'P2002';

export function getNextSequentialPrefixedId(
  existingIds: string[],
  prefix: string,
  startAt: number
): string {
  const normalizedPrefix = `${prefix}-`;
  let maxSuffix = startAt - 1;

  for (const id of existingIds) {
    if (!id.startsWith(normalizedPrefix)) {
      continue;
    }

    const suffix = Number.parseInt(id.slice(normalizedPrefix.length), 10);

    if (Number.isFinite(suffix) && suffix > maxSuffix) {
      maxSuffix = suffix;
    }
  }

  return `${normalizedPrefix}${maxSuffix + 1}`;
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === UNIQUE_CONSTRAINT_ERROR_CODE
  );
}
