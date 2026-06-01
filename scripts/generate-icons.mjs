// Jana ikon PWA Stingers Hockey daripada logo sebenar (public/images/logo.png).
// Logo (lebah putih, latar telus) dikomposit atas latar gelap jenama (#0a0a0a).
//
// Jalankan:  node scripts/generate-icons.mjs

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LOGO = join(ROOT, "public", "images", "logo.png");
const PUBLIC = join(ROOT, "public");

const INK = { r: 10, g: 10, b: 10, alpha: 1 };

// size = saiz ikon; pad = ruang tepi (0..0.5) supaya logo tak cecah tepi.
async function make(size, pad, out) {
  const inner = Math.round(size * (1 - pad * 2));
  const logo = await sharp(LOGO)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: INK } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(PUBLIC, out));
  console.log("✓", out, `${size}x${size}`);
}

await make(192, 0.12, "icon-192.png");
await make(512, 0.12, "icon-512.png");
await make(192, 0.2, "icon-maskable-192.png"); // maskable kecil (zon selamat)
await make(512, 0.2, "icon-maskable-512.png"); // lebih ruang utk zon selamat maskable
await make(180, 0.12, "apple-touch-icon.png");
console.log("Selesai — ikon PWA dijana dari logo sebenar.");
