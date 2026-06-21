/** 
 * Returns the correct asset path with base URL prefix.
 * Handles GitHub Pages subdirectory deployment.
 */
export const assetPath = (path: string): string => {
  const rewritten = rewriteLegacyAssetPath(path);
  const base = import.meta.env.BASE_URL || '/';
  // Remove leading slash from path if base already ends with one
  const cleanPath = rewritten.startsWith('/') ? rewritten.slice(1) : rewritten;
  return `${base}${cleanPath}`;
};

/** Map old flat `/assets/ui/*` and `/assets/hex/*` paths to new generic / garden folders. */
function rewriteLegacyAssetPath(path: string): string {
  if (path.startsWith('/assets/ui/')) {
    const rest = path.slice('/assets/ui/'.length);
    if (rest.startsWith('generic/') || rest.startsWith('garden_')) return path;
    if (/^goal_/.test(rest)) {
      let goalName = rest;
      if (goalName === 'goal_green.png') goalName = 'goal_normal.png';
      if (goalName === 'goal_lightgreen.png') goalName = 'goal_undiscovered.png';
      return `/assets/ui/garden_1/${goalName}`;
    }
    if (/^topui_/.test(rest)) {
      return `/assets/ui/generic/${rest}`;
    }
    return `/assets/ui/generic/${rest}`;
  }
  if (path.startsWith('/assets/hex/hexcell_')) {
    let name = path.slice('/assets/hex/'.length);
    if (name.startsWith('garden_')) return path;
    if (name === 'hexcell_green.png') name = 'hexcell_normal.png';
    return `/assets/hex/garden_1/${name}`;
  }
  return path;
}
