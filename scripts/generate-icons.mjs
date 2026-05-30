// Jana ikon PWA Stingers Hockey daripada SVG → PNG (guna sharp).
//
// Jalankan:  node scripts/generate-icons.mjs
//
// Ikon sementara berjenama (emblem honeycomb amber atas latar gelap).
// Ganti dengan logo sebenar bila sedia: tukar fungsi emblem() di bawah,
// atau letak fail PNG anda sendiri di /public dengan nama yang sama.

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");

const INK = "#0a0a0a";
const AMBER = "#f5b400";

// Laluan heksagon "flat-top" berpusat di (cx,cy) jejari r.
function hex(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

// Emblem honeycomb: cincin heksagon + titik tengah. `scale` 0..1 untuk maskable.
function emblem(scale) {
  const c = 256;
  const r = 150 * scale;
  return `
    <path d="${hex(c, c, r)}" fill="${AMBER}"/>
    <path d="${hex(c, c, r * 0.63)}" fill="${INK}"/>
    <path d="${hex(c, c, r * 0.32)}" fill="${AMBER}"/>
  `;
}

// Ikon biasa (purpose: any) — latar bulat-segi + sempadan amber halus.
function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect x="14" y="14" width="484" height="484" rx="104" fill="${INK}"/>
    <rect x="14" y="14" width="484" height="484" rx="104" fill="none" stroke="${AMBER}" stroke-width="6" opacity="0.5"/>
    ${emblem(1)}
  </svg>`;
}

// Ikon maskable — latar penuh, kandungan dalam zon selamat (~78%).
function maskableSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${INK}"/>
    ${emblem(0.78)}
  </svg>`;
}

async function png(svg, size, name) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(PUBLIC, name));
  console.log("✓", name, `${size}x${size}`);
}

await png(iconSvg(), 192, "icon-192.png");
await png(iconSvg(), 512, "icon-512.png");
await png(maskableSvg(), 512, "icon-maskable-512.png");
await png(iconSvg(), 180, "apple-touch-icon.png");
console.log("Selesai. Ikon PWA dijana ke /public.");
