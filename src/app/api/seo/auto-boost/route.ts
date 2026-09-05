import { NextResponse } from "next/server";
import { canonical } from "@/lib/seo";
import { getAllNews } from "@/lib/news-data";
import { getPublishedRecords } from "@/lib/legasi-data";
import { hantarIndexNow } from "@/lib/indexnow";
import { jalankanAudit } from "@/lib/seo-audit";

// ============================================================================
// Cron SEO harian — menghantar apa yang BERUBAH kepada enjin carian.
//
// Apa yang route ini dahulunya lakukan, dan kenapa ia digantikan sepenuhnya:
//
//   • Ia memanggil `google.com/ping?sitemap=…`. Google membuang endpoint itu
//     pada Jun 2023. Ia membalas HTTP 404 hari ini — disahkan. Setiap larian
//     cron sejak itu melaporkan "✓ Requested" sambil bercakap dengan halaman
//     ralat.
//   • Ia menjana tajuk untuk tiga artikel yang tidak wujud
//     ("Panduan Lengkap Bermain Hoki", "Tips Nutrisi…") dan mengembalikannya
//     dalam JSON. Tiada apa yang pernah menulis kandungan itu ke mana-mana.
//     Alamat yang dituntutnya, /blog/<timestamp>, tidak pernah wujud.
//   • Ia membina "socialPayload" yang tidak pernah dihantar ke mana-mana.
//
//   Kesimpulan: laporan yang mengembalikan empat tanda ✓ untuk kerja yang
//   tidak berlaku. Metrik SEO yang menipu lebih teruk daripada tiada metrik,
//   sebab ia menghentikan orang daripada menyiasat kenapa kedudukan tidak naik.
//
// Yang di bawah ini melakukan satu perkara yang benar-benar berkesan:
// mengenal pasti alamat yang berubah dalam tempoh terkini dan menghantarnya
// ke IndexNow. Balasannya membawa kod status HTTP sebenar, bukan tanda ✓.
// ============================================================================

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Tetingkap "baru berubah". Cron berjalan setiap hari; 48 jam memberi satu
// larian bertindih, jadi satu larian yang tersasar tidak menjatuhkan artikel.
const TETINGKAP_JAM = 48;

async function jalankan() {
  const sejak = Date.now() - TETINGKAP_JAM * 60 * 60 * 1000;

  const [news, legasi] = await Promise.all([getAllNews(), getPublishedRecords()]);

  const beritaBaharu = news.filter((n) => new Date(n.publishedAt).getTime() >= sejak);
  const legasiBaharu = legasi.filter(
    (r) => r.publishedAt && new Date(r.publishedAt).getTime() >= sejak
  );

  // Halaman senarai berubah setiap kali kandungan anaknya berubah, jadi ia
  // hanya dihantar apabila memang ada sesuatu yang baharu untuk dilihat.
  const urls: string[] = [];
  if (beritaBaharu.length > 0) urls.push(canonical("/"), canonical("/berita"));
  if (legasiBaharu.length > 0) urls.push(canonical("/legasi"));
  urls.push(...beritaBaharu.map((n) => canonical(`/berita/${n.slug}`)));
  urls.push(...legasiBaharu.map((r) => canonical(`/legasi/${r.slug}`)));

  const hasil = await hantarIndexNow(urls);

  // Audit berjalan pada setiap larian cron. Pemeriksaan yang hanya berjalan
  // apabila seseorang teringat untuk memanggilnya ialah pemeriksaan yang tidak
  // berjalan — dan kerosakan SEO adalah senyap: tiada siapa perasan canonical
  // yang hilang sehingga trafik jatuh berbulan kemudian.
  //
  // Audit tidak boleh menjatuhkan penghantaran IndexNow, jadi ia dibungkus.
  let audit: Awaited<ReturnType<typeof jalankanAudit>> | null = null;
  try {
    audit = await jalankanAudit();
    if (!audit.ok) {
      // console.error supaya ia timbul sebagai ralat dalam log runtime Vercel
      // dan bukan tenggelam dalam baris maklumat biasa.
      console.error(
        `[seo] ${audit.ringkasan.halamanBerMasalah}/${audit.ringkasan.halamanDiperiksa} halaman bermasalah:`,
        JSON.stringify(audit.masalah)
      );
    }
  } catch (err) {
    console.error("[seo] audit gagal:", err);
  }

  return {
    ok: hasil.ok,
    audit: audit
      ? { ok: audit.ok, ringkasan: audit.ringkasan, masalah: audit.masalah }
      : { ok: null, nota: "Audit tidak dapat dijalankan pada larian ini." },
    pada: new Date().toISOString(),
    tetingkapJam: TETINGKAP_JAM,
    berubah: {
      berita: beritaBaharu.length,
      legasi: legasiBaharu.length,
    },
    indexnow: {
      statusHttp: hasil.status,
      urlDihantar: hasil.dihantar,
      nota: hasil.nota,
    },
    // Bila tiada apa yang berubah, tidak menghantar apa-apa ialah hasil yang
    // BETUL — bukan kegagalan.
    urls,
  };
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await jalankan());
  } catch (error) {
    console.error("[seo/auto-boost] gagal:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
