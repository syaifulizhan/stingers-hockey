import { ImageResponse } from "next/og";

// ============================================================================
// Kad kongsi (Open Graph) — dijana, satu untuk setiap halaman.
//
// KENAPA INI PENTING UNTUK LAMAN INI SECARA KHUSUS. Laman ini tersebar melalui
// WhatsApp: seorang ibu bapa menampal pautan ke dalam kumpulan kelas. Yang
// menentukan sama ada empat puluh orang lain menekannya ialah kad pratonton,
// bukan kedudukan carian. Sebelum ini artikel tanpa gambar dikongsi tanpa kad
// langsung — sekeping teks kelabu.
//
// Perkongsian itu juga mempunyai kesan carian: pautan yang ditekan orang
// menjadi pautan yang orang siarkan semula di tempat lain, dan pautan masuk
// itulah yang sebenarnya menggerakkan kedudukan.
// ============================================================================

export const SAIZ_OG = { width: 1200, height: 630 };
export const JENIS_OG = "image/png";

const INK = "#0a0a0a";
const PAPER = "#f4f1ea";
const AMBER = "#f5b400";
const MUTED = "#8a8a8a";

// Anton ialah fon tajuk laman. Ia diambil sekali dan disimpan dalam memori
// modul; instance fungsi yang panas menggunakan semula buffer yang sama.
let antonCache: ArrayBuffer | null | undefined;

async function anton(): Promise<ArrayBuffer | null> {
  if (antonCache !== undefined) return antonCache;
  try {
    // Google Fonts CSS → URL fail .ttf sebenar. `text=` dibiarkan kosong supaya
    // kita mendapat fon penuh, bukan subset satu halaman.
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Anton&display=swap",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
    antonCache = url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    // Kad dengan fon lalai masih jauh lebih baik daripada tiada kad. Jangan
    // sekali-kali biarkan pengambilan fon menjatuhkan penjanaan gambar.
    antonCache = null;
  }
  return antonCache ?? null;
}

export type KadOg = {
  /** Baris kecil di atas — jenis halaman: "BERITA", "HALL OF HONOUR". */
  kicker?: string;
  /** Teks besar. Dipendekkan jika terlalu panjang untuk dibaca. */
  tajuk: string;
  /** Satu baris konteks di bawah tajuk. */
  perihal?: string;
  /** Gambar latar penuh, digelapkan supaya teks kekal boleh dibaca. */
  latar?: string | null;
};

/** Bina kad kongsi berjenama. Digunakan oleh setiap opengraph-image.tsx. */
export async function kadOg({ kicker, tajuk, perihal, latar }: KadOg) {
  const fontData = await anton();

  // Tajuk panjang mengecil supaya sentiasa muat dalam bingkai.
  const bersih = tajuk.replace(/\s+/g, " ").trim();
  const dipotong = bersih.length > 105 ? `${bersih.slice(0, 104).trimEnd()}…` : bersih;
  const saizTajuk = dipotong.length > 75 ? 56 : dipotong.length > 45 ? 68 : 84;

  return new ImageResponse(
    (
      // Bekas luar TIDAK berpadding. Lapisan latar diletak secara mutlak
      // terhadap kotak padding, jadi padding pada bekas yang sama menolak
      // gambar ke dalam dan meninggalkan jalur hitam di tepi kiri dan atas —
      // kelihatan jelas pada foto yang cerah. Padding kini berada pada lapisan
      // kandungan di dalam, di mana ia tidak menyentuh latar.
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: INK,
          position: "relative",
          fontFamily: fontData ? "Anton" : "sans-serif",
        }}
      >
        {latar ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={latar}
              alt=""
              width={1200}
              height={630}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "1200px",
                height: "630px",
                objectFit: "cover",
              }}
            />
            {/* Tudung gelap: teks putih di atas gambar sukan yang cerah tidak
                boleh dibaca tanpanya. */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "1200px",
                height: "630px",
                background:
                  "linear-gradient(90deg, rgba(10,10,10,0.94) 0%, rgba(10,10,10,0.86) 55%, rgba(10,10,10,0.60) 100%)",
              }}
            />
          </>
        ) : null}

        {/* Jalur aksen amber di tepi kiri — tanda jenama yang sama pada setiap kad. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "14px",
            height: "630px",
            background: AMBER,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            width: "1200px",
            height: "630px",
            padding: "64px 72px",
          }}
        >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {kicker ? (
            <div
              style={{
                display: "flex",
                fontSize: 26,
                letterSpacing: "0.22em",
                color: AMBER,
                marginBottom: 20,
              }}
            >
              {kicker.toUpperCase()}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: saizTajuk,
              lineHeight: 1.08,
              color: PAPER,
              textTransform: "uppercase",
            }}
          >
            {dipotong}
          </div>
          {perihal ? (
            <div
              style={{
                display: "flex",
                fontSize: 28,
                lineHeight: 1.35,
                color: MUTED,
                marginTop: 24,
                fontFamily: "sans-serif",
              }}
            >
              {perihal.length > 150 ? `${perihal.slice(0, 149).trimEnd()}…` : perihal}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <div style={{ display: "flex", fontSize: 40, color: PAPER, letterSpacing: "0.04em" }}>
              STINGERS
            </div>
            <div style={{ display: "flex", fontSize: 40, color: AMBER, marginLeft: 12 }}>
              HOCKEY
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: MUTED,
              letterSpacing: "0.14em",
              fontFamily: "sans-serif",
            }}
          >
            HOKI.MY
          </div>
        </div>
        </div>
      </div>
    ),
    {
      ...SAIZ_OG,
      ...(fontData
        ? { fonts: [{ name: "Anton", data: fontData, style: "normal" as const, weight: 400 as const }] }
        : {}),
    }
  );
}
