#!/usr/bin/env node
/**
 * Penjana QR legasi — satu kod statik bagi setiap pemain, aras pembetulan ralat H,
 * dengan lebah Stingers pada tampalan gelap di tengah.
 *
 * Kod ini dijana SEKALI. URL-nya tidak pernah berubah, jadi QR ini tidak pernah
 * perlu dijana semula — walaupun reka bentuk halaman berubah sepenuhnya.
 *
 * Jalankan: node scripts/jana-qr-legasi.mjs <logo.png> <folder-output>
 */

import QRCode from "qrcode";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BEE_PNG = process.argv[2];
const OUT_DIR = process.argv[3];
// Nisbah lebar tampalan logo. Ditala secara empirik — lihat nota di bawah.
const PATCH_RATIO = Number(process.argv[4] || 0.20);

const INK = "#0A0A0A";      // modul QR
const PAPER = "#FFFFFF";    // latar (putih tulen — kontras maksimum untuk pengimbas)
const QUIET = 4;            // zon senyap, dalam unit modul (standard minimum)
const PRINT_MM = 30;        // saiz cetak yang disyorkan

const ORANG = [
  { slug: "kama-nizar-zahin", nama: "Kama Nizar Zahin", rekod: "SH-2026-01" },
  { slug: "adelia-khadeeja", nama: "Adelia Khadeeja", rekod: "SH-2026-02" },
];

const beeB64 = readFileSync(BEE_PNG).toString("base64");
const beeHref = `data:image/png;base64,${beeB64}`;

function binaSvg(url, modules) {
  const n = modules.size;
  const d = modules.data;
  const total = n + QUIET * 2;

  // Satu laluan bagi semua modul gelap — fail lebih kecil, tepi lebih tajam.
  let path = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (d[y * n + x]) path += `M${x + QUIET} ${y + QUIET}h1v1h-1z`;
    }
  }

  // Tampalan tengah. Diuji dengan Vision (enjin keluarga kamera iPhone) pada 16%,
  // 20% dan 24%: ketiga-tiganya nyahkod sama baik dengan QR tanpa logo — turun ke
  // 100px, kabur teruk, hingar sigma 80, dan 28% sudut hilang. 20% dipilih kerana
  // lebah masih jelas dilihat sambil mengekalkan margin. Jangan naikkan melebihi
  // 24% tanpa menjalankan semula ujian itu.
  const patch = Math.round(total * PATCH_RATIO);
  const patchXY = (total - patch) / 2;
  const halo = 0.7;               // gelang putih memisahkan tampalan dari modul
  const inset = patch * 0.16;     // ruang bernafas di sekeliling lebah

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PRINT_MM}mm" height="${PRINT_MM}mm" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="Kod QR ke ${url}">
  <title>${url}</title>
  <rect width="${total}" height="${total}" fill="${PAPER}"/>
  <path d="${path}" fill="${INK}"/>
  <rect x="${patchXY - halo}" y="${patchXY - halo}" width="${patch + halo * 2}" height="${patch + halo * 2}" rx="${patch * 0.22}" fill="${PAPER}"/>
  <rect x="${patchXY}" y="${patchXY}" width="${patch}" height="${patch}" rx="${patch * 0.18}" fill="${INK}"/>
  <image href="${beeHref}" x="${patchXY + inset}" y="${patchXY + inset}" width="${patch - inset * 2}" height="${patch - inset * 2}" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;
}

mkdirSync(OUT_DIR, { recursive: true });
const laporan = [];

for (const p of ORANG) {
  const url = `https://hoki.my/legasi/${p.slug}`;
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });

  const svg = binaSvg(url, qr.modules);
  const svgPath = join(OUT_DIR, `QR-${p.slug}.svg`);
  writeFileSync(svgPath, svg);

  // PNG kawalan (tanpa logo) — untuk membandingkan jika imbasan bermasalah.
  const pngPath = join(OUT_DIR, `QR-${p.slug}-tanpa-logo.png`);
  await QRCode.toFile(pngPath, url, {
    errorCorrectionLevel: "H",
    margin: QUIET,
    width: 1200,
    color: { dark: INK, light: PAPER },
  });

  laporan.push({
    nama: p.nama,
    rekod: p.rekod,
    url,
    aksara: url.length,
    versi: qr.version,
    modul: `${qr.modules.size}×${qr.modules.size}`,
    saizCetak: `${PRINT_MM}mm`,
    saizModul: `${(PRINT_MM / (qr.modules.size + QUIET * 2)).toFixed(2)}mm`,
    svg: svgPath,
  });
}

console.log(JSON.stringify(laporan, null, 2));
