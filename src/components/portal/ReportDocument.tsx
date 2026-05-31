import type { ReportData } from "@/lib/build-report";

// Laporan kemenjadian — format dokumen A4 profesional (Arial, jadual, justify).
// Direka untuk dicetak: latar putih, teks hitam, tidak terjejas tema gelap.
export default function ReportDocument({ data }: { data: ReportData }) {
  const cell = "border border-black/40 px-3 py-1.5 align-top";
  const th = `${cell} font-bold`;

  return (
    <div
      className="report-area mx-auto bg-white text-black"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12pt",
        lineHeight: 1.5,
        textAlign: "justify",
        maxWidth: "210mm",
        padding: "2.54cm",
      }}
    >
      <h1 className="text-center" style={{ fontSize: "16pt", fontWeight: 700, marginBottom: "2pt" }}>
        LAPORAN KEMENJADIAN PEMAIN
      </h1>
      <p className="text-center" style={{ fontSize: "12pt", marginBottom: "16pt" }}>
        Stingers Hockey — SK Taman Desaminium
      </p>

      {/* A. Maklumat Asas */}
      <SectionTitle>A. Maklumat Asas Pemain</SectionTitle>
      <table className="w-full border-collapse" style={{ marginBottom: "16pt" }}>
        <tbody>
          <Row k="Nama Pemain" v={data.name} />
          <Row
            k="Umur / Tarikh Lahir"
            v={[data.age != null ? `${data.age} tahun` : null, data.dob].filter(Boolean).join(" / ") || "-"}
          />
          <Row k="Jantina" v={data.gender || "-"} />
          <Row
            k="Posisi"
            v={data.position || (data.isGoalkeeper ? "Penjaga Gol" : "-")}
          />
          <Row k="Pasukan / Kategori" v={data.yearClass || "Stingers Hockey"} />
          <Row k="Tarikh Laporan" v={data.generatedOn} />
        </tbody>
      </table>

      {/* B. Profil Kecergasan */}
      <SectionTitle>B. Profil Kecergasan</SectionTitle>
      {data.fitness.some((f) => f.latest != null) ? (
        <table className="w-full border-collapse" style={{ marginBottom: "16pt" }}>
          <thead>
            <tr>
              <th className={th}>Ujian</th>
              <th className={th}>Terkini</th>
              <th className={th}>Rekod Peribadi (PB)</th>
            </tr>
          </thead>
          <tbody>
            {data.fitness
              .filter((f) => f.latest != null)
              .map((f) => (
                <tr key={f.label}>
                  <td className={cell}>{f.label}</td>
                  <td className={cell}>{f.latest != null ? `${f.latest} ${f.unit}` : "-"}</td>
                  <td className={cell}>{f.pb != null ? `${f.pb} ${f.unit}` : "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      ) : (
        <p style={{ marginBottom: "16pt" }}>Tiada data ujian kecergasan direkodkan lagi.</p>
      )}

      {/* C. Penilaian Prestasi */}
      <SectionTitle>C. Penilaian Prestasi (skala 1–10)</SectionTitle>
      <p style={{ fontWeight: 700, margin: "8pt 0 4pt" }}>1.0 {data.skillTitle}</p>
      <ScoreTable rows={data.skill} cell={cell} th={th} />
      <p style={{ fontWeight: 700, margin: "12pt 0 4pt" }}>2.0 Atribut Psikologi & Tingkah Laku</p>
      <ScoreTable rows={data.coachEval} cell={cell} th={th} />
      <table className="w-full border-collapse" style={{ marginTop: "8pt", marginBottom: "16pt" }}>
        <tbody>
          <Row
            k="Kehadiran Latihan"
            v={`${data.attendance.trainPresent}/${data.attendance.trainTotal}`}
          />
          <Row
            k="Kehadiran Perlawanan"
            v={`${data.attendance.matchPresent}/${data.attendance.matchTotal}`}
          />
          <Row
            k="Peratus Kehadiran"
            v={data.attendance.pct != null ? `${data.attendance.pct}%` : "-"}
          />
        </tbody>
      </table>

      {/* D. Analisis */}
      <SectionTitle>D. Analisis Pemain</SectionTitle>
      <p style={{ fontWeight: 700, margin: "8pt 0 2pt" }}>Kekuatan (Strengths)</p>
      <ul style={{ marginBottom: "8pt", paddingLeft: "18pt", listStyle: "disc" }}>
        {data.report.strengths.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      <p style={{ fontWeight: 700, margin: "8pt 0 2pt" }}>Kelemahan (Weaknesses)</p>
      <ul style={{ marginBottom: "8pt", paddingLeft: "18pt", listStyle: "disc" }}>
        {data.report.improvements.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      <p style={{ fontWeight: 700, margin: "8pt 0 2pt" }}>Cadangan Jurulatih</p>
      <p style={{ marginBottom: "16pt" }}>{data.report.recommendation}</p>

      {/* E. Tandatangan */}
      <div style={{ marginTop: "32pt" }}>
        <p>Laporan ini disediakan dan disahkan oleh:</p>
        <p style={{ marginTop: "32pt" }}>............................................</p>
        <p style={{ fontWeight: 700 }}>(NAMA JURULATIH / PENILAI)</p>
        <p>Jawatan: Ketua Jurulatih / Pegawai Pembangunan Bakat</p>
        <p>Tarikh: ..............................</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "14pt", fontWeight: 700, margin: "12pt 0 6pt" }}>{children}</h2>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <td className="border border-black/40 px-3 py-1.5 font-bold" style={{ width: "40%" }}>
        {k}
      </td>
      <td className="border border-black/40 px-3 py-1.5">{v}</td>
    </tr>
  );
}

function ScoreTable({
  rows,
  cell,
  th,
}: {
  rows: { label: string; score: number | null }[];
  cell: string;
  th: string;
}) {
  if (rows.every((r) => r.score == null)) {
    return <p>Belum dinilai.</p>;
  }
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className={th} style={{ width: "60%" }}>
            Aspek
          </th>
          <th className={th}>Skor</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td className={cell}>{r.label}</td>
            <td className={cell}>{r.score != null ? `${r.score} / 10` : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
