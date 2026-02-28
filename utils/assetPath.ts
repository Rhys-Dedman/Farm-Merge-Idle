/** 
 * Returns the correct asset path with base URL prefix.
 * Handles GitHub Pages subdirectory deployment.
 */
export const assetPath = (path: string): string => {
  const base = import.meta.env.BASE_URL || '/';
  // Remove leading slash from path if base already ends with one
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
};
