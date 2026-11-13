// Draws St. Michael's app icons: the cathedral's dome, lantern and cross in gold on a crimson glow.
// Pure Node (no image libraries): shapes are tested per sample, 4x4 supersampled, and written as PNG.
// Run from this folder:  node make-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---- PNG writing ----------------------------------------------------------
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(size, rgba, alpha) {
  const channels = alpha ? 4 : 3;
  const raw = Buffer.alloc(size * (size * channels + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * channels + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const o = y * (size * channels + 1) + 1 + x * channels;
      raw[o] = rgba[i];
      raw[o + 1] = rgba[i + 1];
      raw[o + 2] = rgba[i + 2];
      if (alpha) raw[o + 3] = rgba[i + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = alpha ? 6 : 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Colours --------------------------------------------------------------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const ramp = (stops, t) => {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1] = stops[i];
    const [p0, c0] = stops[i - 1];
    if (t <= p1) return mix(c0, c1, (t - p0) / (p1 - p0));
  }
  return stops[stops.length - 1][1];
};
const glow = [[0, hex('#B23246')], [0.45, hex('#7A1626')], [1, hex('#33050E')]];
const goldStops = [[0, hex('#FBE7AE')], [0.5, hex('#E2B85C')], [1, hex('#B07A22')]];
const shade = hex('#5A1420');

// ---- The emblem, in a 1024 design space ------------------------------------
// Returns null outside, else 'gold' or 'shade' (windows, ribs, lantern slits).
const DY = 96; // shifts the emblem down so it sits centred
const inRect = (x, y, x0, y0, x1, y1) => x >= x0 && x <= x1 && y >= y0 + DY && y <= y1 + DY;
function emblem(x, y) {
  // Cross
  if (inRect(x, y, 500, 150, 524, 300) || inRect(x, y, 466, 190, 558, 213)) return 'gold';
  // Ball under the cross
  if ((x - 512) ** 2 + (y - (314 + DY)) ** 2 <= 19 ** 2) return 'gold';
  // Lantern with three slits, and its little cap
  if (inRect(x, y, 474, 332, 550, 396)) {
    for (const cx of [490, 512, 534]) if (inRect(x, y, cx - 5, 344, cx + 5, 384)) return 'shade';
    return 'gold';
  }
  if (inRect(x, y, 462, 324, 562, 336)) return 'gold';
  // Dome: the upper half of an ellipse, with ribs
  const cy = 568 + DY;
  const rx = 236;
  const ry = 176;
  if (y <= cy && ((x - 512) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) {
    const half = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
    const u = (x - 512) / Math.max(half, 1);
    for (const rib of [-0.62, -0.31, 0, 0.31, 0.62]) if (Math.abs(u - rib) < 0.035 && y > cy - ry + 18) return 'shade';
    if (y > cy - 14) return 'shade'; // the dome's lower edge line
    return 'gold';
  }
  // Drum with six arched windows
  if (inRect(x, y, 266, 568, 758, 652)) {
    for (let i = 0; i < 6; i++) {
      const wx = 316 + i * 78.4;
      const archY = 590 + DY;
      if (x >= wx - 14 && x <= wx + 14 && y >= archY && y <= 638 + DY) return 'shade';
      if ((x - wx) ** 2 + (y - archY) ** 2 <= 14 ** 2) return 'shade';
    }
    return 'gold';
  }
  // Cornice and steps
  if (inRect(x, y, 234, 652, 790, 676) || inRect(x, y, 214, 684, 810, 700)) return 'gold';
  return null;
}

// ---- Rendering ------------------------------------------------------------
function render(size, { background, scale = 1, mono = false, ring = false, samples = 4 }) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const X = ((px + (sx + 0.5) / samples) / size) * 1024;
          const Y = ((py + (sy + 0.5) / samples) / size) * 1024;
          const ex = 512 + (X - 512) / scale;
          const ey = 512 + (Y - 512) / scale;
          let color = null;
          let alpha = 0;
          if (background) {
            color = ramp(glow, Math.hypot(X - 512, Y - 400) / 760);
            alpha = 1;
            if (ring) {
              const d = Math.abs(Math.hypot(X - 512, Y - 512) - 438);
              if (d < 3.5) color = mix(color, hex('#E2B85C'), 0.45);
            }
          }
          const part = scale > 0 ? emblem(ex, ey) : null;
          if (part) {
            const gold = mono ? [255, 255, 255] : ramp(goldStops, (ey - 200) / 560);
            const ink = part === 'gold' ? gold : mono ? null : background ? mix(shade, color, 0.15) : shade;
            if (ink) {
              color = ink;
              alpha = 1;
            } else if (!background) {
              alpha = 0; // monochrome: windows and ribs are cut out
            }
          }
          if (color) {
            r += color[0] * alpha;
            g += color[1] * alpha;
            b += color[2] * alpha;
          }
          a += alpha;
        }
      }
      const n = samples * samples;
      const i = (py * size + px) * 4;
      rgba[i] = a ? Math.round(r / a) : 0;
      rgba[i + 1] = a ? Math.round(g / a) : 0;
      rgba[i + 2] = a ? Math.round(b / a) : 0;
      rgba[i + 3] = Math.round((a / n) * 255);
    }
  }
  return rgba;
}

const out = (name, size, options, alpha) => {
  fs.writeFileSync(path.join(__dirname, name), png(size, render(size, options), alpha));
  console.log('wrote', name);
};

// App store icon (no transparency), adaptive icon layers for Android, splash mark and favicon.
out('icon.png', 1024, { background: true, ring: true }, false);
out('adaptive-background.png', 1024, { background: true, scale: 0 }, false);
out('adaptive-icon.png', 1024, { background: false, scale: 0.75 }, true);
out('monochrome-icon.png', 1024, { background: false, scale: 0.75, mono: true }, true);
out('splash-icon.png', 512, { background: false, scale: 0.9 }, true);
out('favicon.png', 48, { background: true, samples: 8 }, false);
