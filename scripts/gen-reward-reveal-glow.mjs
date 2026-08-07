/**
 * Generates transparent PNGs for Special Delivery reward reveal glow VFX.
 * Run: node scripts/gen-reward-reveal-glow.mjs
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'assets', 'vfx');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = u32(data.length);
  const crcBuf = Buffer.concat([typeBuf, data]);
  return Buffer.concat([len, typeBuf, data, u32(crc32(crcBuf))]);
}

function writePng(filePath, width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(filePath, png);
}

function setPx(rgba, w, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= w || y >= w) return;
  const i = (y * w + x) * 4;
  // Premultiplied-style over for soft accumulation
  const oa = rgba[i + 3] / 255;
  const na = a / 255;
  const outA = na + oa * (1 - na);
  if (outA <= 0) return;
  rgba[i] = Math.round((r * na + rgba[i] * oa * (1 - na)) / outA);
  rgba[i + 1] = Math.round((g * na + rgba[i + 1] * oa * (1 - na)) / outA);
  rgba[i + 2] = Math.round((b * na + rgba[i + 2] * oa * (1 - na)) / outA);
  rgba[i + 3] = Math.round(outA * 255);
}

function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

/** Soft circular gold glow (radial). */
function makeGlow(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const maxR = size * 0.5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy) / maxR;
      if (d > 1) continue;
      // Hot core + wide soft falloff (reference halo)
      const core = Math.pow(1 - clamp01(d / 0.42), 1.4);
      const mid = Math.pow(1 - clamp01(d), 1.65);
      const a = Math.round(255 * Math.min(1, core * 0.9 + mid * 0.7));
      if (a <= 0) continue;
      const t = clamp01(d);
      const r = 255;
      const g = Math.round(lerp(236, 198, t));
      const b = Math.round(lerp(130, 35, t));
      setPx(rgba, size, x, y, r, g, b, a);
    }
  }
  return rgba;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Rotating sunburst — soft tapered rays. `rayWidth` 0–1 fraction of sector half-width. */
function makeSunburst(size, rayCount = 12, rayWidth = 0.42) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const maxR = size * 0.5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy) / maxR;
      if (dist < 0.02 || dist > 0.99) continue;
      let ang = Math.atan2(dy, dx);
      if (ang < 0) ang += Math.PI * 2;
      const sector = (Math.PI * 2) / rayCount;
      const local = ((ang + sector / 2) % sector) - sector / 2;
      const halfWidth = sector * rayWidth;
      const rayT = 1 - Math.abs(local) / halfWidth;
      if (rayT <= 0) continue;
      // Soft wedge + length fade
      const tip = Math.pow(rayT, 1.8);
      const radial =
        dist < 0.15
          ? dist / 0.15
          : dist > 0.7
            ? Math.pow(1 - (dist - 0.7) / 0.3, 1.6)
            : 1;
      const a = Math.round(255 * tip * radial * 0.78);
      if (a <= 0) continue;
      const r = 255;
      const g = Math.round(lerp(240, 205, dist));
      const b = Math.round(lerp(150, 55, dist));
      setPx(rgba, size, x, y, r, g, b, a);
    }
  }
  return rgba;
}

/** 4-point sparkle star (cross). */
function makeSparkle(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const maxR = size * 0.48;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / maxR;
      const dy = (y - cy) / maxR;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      // 4-point star: thin arms on axes, soft diamond core
      const arm =
        Math.pow(Math.max(0, 1 - ax / 0.18), 2.2) * Math.pow(Math.max(0, 1 - ay), 1.1) +
        Math.pow(Math.max(0, 1 - ay / 0.18), 2.2) * Math.pow(Math.max(0, 1 - ax), 1.1);
      const core = Math.pow(Math.max(0, 1 - Math.hypot(dx, dy) / 0.22), 2);
      const v = Math.min(1, arm * 0.85 + core);
      if (v <= 0.02) continue;
      const a = Math.round(255 * Math.pow(v, 0.85));
      const r = 255;
      const g = Math.round(lerp(255, 240, 1 - v));
      const b = Math.round(lerp(255, 180, 1 - v));
      setPx(rgba, size, x, y, r, g, b, a);
    }
  }
  return rgba;
}

fs.mkdirSync(outDir, { recursive: true });

const files = [
  ['reward_reveal_glow.png', makeGlow(512)],
  ['reward_reveal_sunburst.png', makeSunburst(768, 12, 0.42)],
  ['reward_reveal_sunburst_thick.png', makeSunburst(768, 12, 0.72)],
  ['reward_reveal_sparkle.png', makeSparkle(128)],
];

for (const [name, rgba] of files) {
  const size = Math.sqrt(rgba.length / 4);
  const dest = path.join(outDir, name);
  writePng(dest, size, size, rgba);
  console.log('wrote', dest, `${size}x${size}`);
}
