export function isAbsolutePathOrUrl(value: string): boolean {
  if (value.startsWith('/')) {
    return true;
  }

  return /^https?:\/\//.test(value);
}
