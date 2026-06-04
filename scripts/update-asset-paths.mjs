/**
 * One-off: apply asset-map.txt + manual renames to source files.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapFile = path.join(root, 'asset-map.txt');

const manual = {
  '/assets/background/background_barn.png': '/assets/collection/background_collection.png',
  '/assets/background/background_grass.png': '/assets/background/background_garden_1.png',
  '/assets/barn/barn_roof.png': '/assets/collection/collection_roof.png',
  '/assets/barn/barn_shelf.png': '/assets/collection/collection_shelf.png',
  '/assets/barn/barn_tools.png': '/assets/collection/collection_tools.png',
  '/assets/icons/icon_level.png': '/assets/ui/ui_level.png',
  '/assets/icons/icon_logo.png': '/assets/ui/ui_logo.png',
  '/assets/icons/icon_finger.png': '/assets/ui/ui_finger.png',
  '/assets/vfx/particle_leaf_1.png': '/assets/vfx/particle_leaf_green_1.png',
  '/assets/vfx/particle_leaf_2.png': '/assets/vfx/particle_leaf_green_2.png',
  '/assets/vfx/particle_leaf_3.png': '/assets/vfx/particle_leaf_yellow_1.png',
  '/assets/vfx/particle_leaf_4.png': '/assets/vfx/particle_leaf_yellow_2.png',
  '/assets/vfx/particle_leaf_5.png': '/assets/vfx/particle_leaf_blue_1.png',
  '/assets/vfx/particle_leaf_6.png': '/assets/vfx/particle_leaf_blue_2.png',
  '/assets/vfx/particle_leaf_7.png': '/assets/vfx/particle_leaf_background_green.png',
  '/assets/vfx/particle_leaf_8.png': '/assets/vfx/particle_leaf_background_shadow.png',
  '/assets/vfx/particle_leaf_9.png': '/assets/vfx/particle_leaf_red_1.png',
  '/assets/vfx/particle_leaf_10.png': '/assets/vfx/particle_leaf_red_2.png',
  '/assets/vfx/particle_leaf_11.png': '/assets/vfx/particle_leaf_purple_1.png',
  '/assets/vfx/particle_leaf_12.png': '/assets/vfx/particle_leaf_purple_2.png',
  '/assets/icons/icon_limitedoffer_harvestspeed.png': '/assets/icons/upgrades/icon_harvestspeed.png',
};

const map = { ...manual };
for (const line of fs.readFileSync(mapFile, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^(.+?)\s+->\s+(.+)$/);
  if (!m) continue;
  const from = m[1].trim();
  const to = m[2].trim();
  if (from === to) continue;
  map[from] = to;
}

// Dynamic path segments (apply after literal map)
const segmentReplacements = [
  ['/assets/icons/icons_goals/', '/assets/icons/goals/garden_1/'],
  ['/assets/plants/plant_', '/assets/plants/garden_1/plant_'],
];

const exts = new Set(['.ts', '.tsx', '.html', '.json', '.mdc']);
const skipDirs = new Set(['node_modules', 'dist', '.git', 'scripts']);

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (exts.has(path.extname(ent.name))) files.push(p);
  }
  return files;
}

const entries = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
let total = 0;

for (const file of walk(root)) {
  if (file.includes('asset-map.txt') || file.endsWith('update-asset-paths.mjs')) continue;
  let text = fs.readFileSync(file, 'utf8');
  const orig = text;
  for (const [from, to] of entries) {
    if (text.includes(from)) {
      text = text.split(from).join(to);
    }
    const fromDot = from.replace('/assets/', './assets/');
    const toDot = to.replace('/assets/', './assets/');
    if (fromDot !== from && text.includes(fromDot)) {
      text = text.split(fromDot).join(toDot);
    }
  }
  for (const [from, to] of segmentReplacements) {
    if (text.includes(from)) text = text.split(from).join(to);
  }
  if (text !== orig) {
    fs.writeFileSync(file, text);
    total++;
    console.log('updated', path.relative(root, file));
  }
}

console.log('Done. Files changed:', total);
