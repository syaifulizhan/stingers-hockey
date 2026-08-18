#!/usr/bin/env node
/**
 * Semakan: setiap laluan portal MESTI melalui gate allowlist.
 *
 * Kegagalan asal sistem ini ialah laluan yang terlepas dari senarai
 * perlindungan tanpa sesiapa perasan. Skrip ini menjadikan kelalaian itu
 * kegagalan yang lantang, bukan lubang yang senyap.
 *
 * Jalankan: node scripts/check-portal-gates.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

// Laluan yang SENGAJA boleh dicapai tanpa kelulusan penuh, dengan sebabnya.
const EXEMPT = {
  "src/app/portal/page.tsx": "halaman pendaratan awam (butang log masuk)",
  "src/app/portal/sign-in/[[...sign-in]]/page.tsx": "skrin log masuk",
  "src/app/portal/sign-up/[[...sign-up]]/page.tsx": "skrin daftar",
  "src/app/portal/approval-pending/page.tsx": "skrin 'menunggu kelulusan' itu sendiri",
  "src/app/portal/onboarding/page.tsx": "borang profil — memberi admin maklumat untuk menilai",
  "src/app/portal/layout.tsx": "layout, tiada pengambilan data",
  "src/app/api/portal/profile/route.ts": "dibaca oleh skrin 'menunggu kelulusan'; dikunci pada userId sendiri",
};

const GATES = [
  "requireApprovedPage",
  "requireCoachPage",
  "requireAdminPage",
  "requireApprovedApi",
  "requireCoachApi",
  "requireAdminApi",
];

const files = [...walk("src/app/portal"), ...walk("src/app/api/portal")].filter(
  (f) => f.endsWith("page.tsx") || f.endsWith("route.ts")
);

// Mesti satu PANGGILAN yang di-await — bukan sekadar baris import. Versi
// pertama skrip ini memadankan mana-mana kemunculan nama, jadi membuang
// panggilan sambil mengekalkan import tetap "lulus". Ia tidak lagi begitu.
const called = (src, gate) =>
  new RegExp(`await\\s+${gate}\\s*\\(`).test(src);

const failures = [];
for (const f of files) {
  if (EXEMPT[f]) continue;
  const src = readFileSync(f, "utf8");
  if (!GATES.some((g) => called(src, g))) failures.push(f);
}

if (failures.length) {
  console.error("\n✗ Laluan portal TANPA gate allowlist:\n");
  for (const f of failures) console.error("   " + f);
  console.error(
    "\nTambah requireApprovedPage() / requireApprovedApi() (atau varian coach/admin),\n" +
      "atau daftarkan pengecualian bersama sebabnya dalam EXEMPT di skrip ini.\n"
  );
  process.exit(1);
}

console.log(
  `✓ ${files.length - Object.keys(EXEMPT).length} laluan portal bergate, ` +
    `${Object.keys(EXEMPT).length} pengecualian yang didokumen.`
);
