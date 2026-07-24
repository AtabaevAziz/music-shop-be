export function normalizeMediaPath(path: string): string {
  const trimmedPath = path.trim();

  if (/^https?:\/\//.test(trimmedPath)) {
    return trimmedPath;
  }

  const normalizedPath = trimmedPath.replace(/^\/+/, '');

  if (normalizedPath.startsWith('public/products/')) {
    return `/assets/${normalizedPath.slice('public/products/'.length)}`;
  }

  if (normalizedPath.startsWith('products/')) {
    return `/assets/${normalizedPath.slice('products/'.length)}`;
  }

  if (normalizedPath.startsWith('public/assets/')) {
    return `/${normalizedPath.slice('public/'.length)}`;
  }

  if (normalizedPath.startsWith('assets/')) {
    return `/${normalizedPath}`;
  }

  return trimmedPath;
}
