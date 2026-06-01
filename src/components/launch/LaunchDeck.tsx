import {
  CalendarCheck,
  Star,
  Activity,
  Swords,
  FileText,
  Trophy,
  Download,
} from "lucide-react";
import PhoneMockup from "@/components/launch/PhoneMockup";

const TOTAL = 6;

function Slide({
  n,
  children,
}: {
  n: number;
  children: React.ReactNode;
}) {
  return (
    <section className="slide relative flex min-h-screen w-full flex-col justify-center bg-ink px-8 py-12 sm:px-16">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2">
        {children}
      </div>
      <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex justify-between px-8 font-sans text-xs text-muted sm:px-16">
        <span>STINGERS HOCKEY</span>
        <span>
          {String(n).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")} · hoki.my
        </span>
      </div>
    </section>
  );
}

// ── Skrin mock dalam telefon ──
function ScreenBar() {
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-3">
      <span className="font-sans text-sm font-bold tracking-tight text-paper">
        STINGERS<span className="text-amber">.</span>
      </span>
      <span className="h-2 w-2 rounded-full bg-amber" />
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg-soft/60 py-2 text-center">
      <div className="font-sans text-lg font-bold text-amber">{value}</div>
      <div className="font-sans text-[0.55rem] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

function Bar({ w }: { w: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-soft">
      <div className="h-full rounded-full bg-amber" style={{ width: w }} />
    </div>
  );
}

export default function LaunchDeck({ qr }: { qr: string }) {
  return (
    <div className="deck-area">
      {/* SLIDE 1 — Tajuk */}
      <Slide n={1}>
        <div>
          <span className="font-sans text-sm font-semibold uppercase tracking-[0.3em] text-amber">
            Stingers Hockey
          </span>
          <h1 className="display mt-4 text-6xl leading-none text-paper sm:text-7xl">
            STINGERS<span className="text-amber"> APP</span>
          </h1>
          <p className="mt-6 max-w-md font-sans text-base leading-relaxed text-paper/80">
            Dibangunkan untuk <span className="text-amber">merekod, memantau</span> dan{" "}
            <span className="text-amber">meningkatkan</span> perkembangan pemain hoki secara
            digital.
          </p>
        </div>
        <div className="flex justify-center">
          <PhoneMockup>
            <ScreenBar />
            <div className="px-4 py-4">
              <p className="font-sans text-xs text-muted">Hai,</p>
              <p className="display text-2xl text-paper">Zahin</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Chip label="Hadir" value="92%" />
                <Chip label="Kemahiran" value="7.8" />
                <Chip label="Gol" value="5" />
              </div>
              <div className="mt-4 rounded-xl border border-line bg-bg-soft/60 p-3">
                <p className="font-sans text-[0.6rem] uppercase tracking-wide text-muted">
                  Profil lengkap
                </p>
                <div className="mt-2">
                  <Bar w="85%" />
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-amber px-3 py-2 text-center font-sans text-xs font-semibold uppercase tracking-wider text-ink">
                Jana Laporan Saya
              </div>
            </div>
          </PhoneMockup>
        </div>
      </Slide>

      {/* SLIDE 2 — Ciri teras */}
      <Slide n={2}>
        <div>
          <h2 className="display text-5xl text-paper">
            Satu Sistem,<br />
            <span className="text-amber">Semua Rekod</span>
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {[
              { Icon: CalendarCheck, t: "Rekod Kehadiran" },
              { Icon: Star, t: "Penilaian Kemahiran" },
              { Icon: Activity, t: "Ujian Kecergasan" },
              { Icon: Swords, t: "Statistik Perlawanan" },
            ].map(({ Icon, t }) => (
              <li key={t} className="flex items-center gap-3 font-sans text-lg text-paper">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/15 text-amber">
                  <Icon className="h-5 w-5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center">
          <PhoneMockup>
            <ScreenBar />
            <div className="px-4 py-4">
              <p className="font-sans text-[0.6rem] uppercase tracking-wide text-muted">
                Penilaian Kemahiran
              </p>
              <div className="mt-3 flex flex-col gap-2.5">
                {[
                  ["Dribbling", "82%"],
                  ["Push Pass", "70%"],
                  ["Tackling", "65%"],
                  ["Shooting", "90%"],
                ].map(([k, w]) => (
                  <div key={k}>
                    <div className="mb-1 flex justify-between font-sans text-[0.6rem] text-paper/80">
                      <span>{k}</span>
                    </div>
                    <Bar w={w} />
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Chip label="Beep Test" value="8.5" />
                <Chip label="Plank" value="60s" />
              </div>
            </div>
          </PhoneMockup>
        </div>
      </Slide>

      {/* SLIDE 3 — Laporan */}
      <Slide n={3}>
        <div>
          <span className="inline-flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-amber">
            <FileText className="h-4 w-4" /> Laporan
          </span>
          <h2 className="display mt-4 text-5xl text-paper">
            Laporan Kemenjadian <span className="text-amber">Automatik</span>
          </h2>
          <p className="mt-6 max-w-md font-sans text-base leading-relaxed text-paper/80">
            Satu klik untuk menghasilkan laporan perkembangan pemain yang{" "}
            <span className="text-amber">profesional</span> — sedia untuk dicetak atau simpan
            PDF.
          </p>
        </div>
        <div className="flex justify-center">
          <PhoneMockup>
            <div className="h-full bg-white p-4 text-black">
              <p className="text-center text-[0.65rem] font-bold">LAPORAN KEMENJADIAN PEMAIN</p>
              <p className="mb-3 text-center text-[0.5rem] text-black/60">Stingers Hockey</p>
              <div className="border border-black/30 text-[0.5rem]">
                <div className="flex border-b border-black/20">
                  <div className="w-1/3 border-r border-black/20 px-1.5 py-1 font-bold">Nama</div>
                  <div className="px-1.5 py-1">Zahin</div>
                </div>
                <div className="flex border-b border-black/20">
                  <div className="w-1/3 border-r border-black/20 px-1.5 py-1 font-bold">Posisi</div>
                  <div className="px-1.5 py-1">Centre Forward</div>
                </div>
              </div>
              <p className="mt-2 text-[0.55rem] font-bold">Kekuatan</p>
              <p className="text-[0.5rem] leading-relaxed text-black/70">
                • Shooting sangat baik (9/10)<br />• Kehadiran cemerlang (92%)
              </p>
              <p className="mt-1.5 text-[0.55rem] font-bold">Cadangan Jurulatih</p>
              <p className="text-[0.5rem] leading-relaxed text-black/70">
                Sesuai dimainkan sebagai Penyerang (Forward).
              </p>
              <p className="mt-3 text-[0.5rem]">............................</p>
              <p className="text-[0.45rem] text-black/60">(NAMA JURULATIH)</p>
            </div>
          </PhoneMockup>
        </div>
      </Slide>

      {/* SLIDE 4 — Ibu Bapa */}
      <Slide n={4}>
        <div>
          <h2 className="display text-5xl text-paper">
            Untuk <span className="text-amber">Ibu Bapa</span>
          </h2>
          <ul className="mt-8 flex flex-col gap-3 font-sans text-lg text-paper/90">
            <li>• Pantau perkembangan anak</li>
            <li>• Lihat pencapaian dan prestasi</li>
            <li>• Ikuti keputusan perlawanan secara langsung</li>
          </ul>
          <p className="mt-6 font-sans text-sm text-muted">
            Tanpa perlu akaun — terus di hoki.my
          </p>
        </div>
        <div className="flex justify-center">
          <PhoneMockup>
            <ScreenBar />
            <div className="px-4 py-4">
              <span className="inline-flex items-center gap-1.5 font-sans text-[0.6rem] font-semibold uppercase tracking-widest text-amber">
                <span className="h-1.5 w-1.5 rounded-full bg-amber" /> Live
              </span>
              <div className="mt-3 rounded-2xl border border-amber/40 bg-amber/5 p-3 text-center">
                <p className="font-sans text-[0.55rem] uppercase tracking-wide text-amber">
                  Perlawanan Terkini
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="font-sans text-sm font-bold text-paper">Stingers</span>
                  <span className="display text-2xl text-amber">3:1</span>
                  <span className="font-sans text-sm font-bold text-paper">SK Cyberjaya</span>
                </div>
                <span className="mt-2 inline-block rounded-full bg-amber px-2 py-0.5 text-[0.55rem] font-semibold text-ink">
                  Menang
                </span>
              </div>
              <p className="mt-3 text-center font-sans text-[0.6rem] text-paper/80">
                Penjaring: Zahin (2), Aiman (1)
              </p>
            </div>
          </PhoneMockup>
        </div>
      </Slide>

      {/* SLIDE 5 — Jurulatih */}
      <Slide n={5}>
        <div>
          <span className="inline-flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-amber">
            <Trophy className="h-4 w-4" /> Jurulatih
          </span>
          <h2 className="display mt-4 text-5xl text-paper">
            Untuk <span className="text-amber">Jurulatih</span>
          </h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Kehadiran", "Penilaian", "Perlawanan", "Pencapaian", "Laporan"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-line px-4 py-1.5 font-sans text-sm font-semibold text-paper"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="mt-6 font-sans text-lg text-amber">Semuanya dalam satu sistem.</p>
        </div>
        <div className="flex justify-center">
          <PhoneMockup>
            <ScreenBar />
            <div className="px-3 py-3">
              <div className="flex gap-1 overflow-hidden">
                {["Ringkasan", "Ahli", "Perlawanan"].map((t, i) => (
                  <span
                    key={t}
                    className={`whitespace-nowrap rounded-full px-2.5 py-1 font-sans text-[0.55rem] font-semibold ${
                      i === 0 ? "bg-amber text-ink" : "border border-line text-paper/70"
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Chip label="Pemain" value="18" />
                <Chip label="Penjaring" value="Zahin" />
                <Chip label="Rajin Hadir" value="Aiman" />
                <Chip label="GK Terbaik" value="Imran" />
              </div>
              <div className="mt-3 rounded-xl border border-line bg-bg-soft/60 p-2.5">
                <p className="font-sans text-[0.55rem] uppercase tracking-wide text-muted">
                  Top 10 Keseluruhan
                </p>
                <p className="mt-1 font-sans text-[0.6rem] text-paper/80">
                  1. Zahin · 2. Aiman · 3. Imran
                </p>
              </div>
            </div>
          </PhoneMockup>
        </div>
      </Slide>

      {/* SLIDE 6 — Install / CTA */}
      <Slide n={6}>
        <div>
          <span className="inline-flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-amber">
            <Download className="h-4 w-4" /> Pasang
          </span>
          <h2 className="display mt-4 text-5xl text-paper">
            Install terus ke <span className="text-amber">telefon</span>
          </h2>
          <p className="mt-6 max-w-md font-sans text-lg leading-relaxed text-paper/80">
            STINGERS APP — <span className="text-amber">Hoki Digital</span> Untuk Generasi Masa
            Hadapan.
          </p>
          {/* QR code → hoki.my */}
          <div className="mt-7 flex items-center gap-4">
            <div
              className="h-28 w-28 rounded-xl bg-white p-2"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <div>
              <p className="font-sans text-base font-semibold text-paper">Imbas untuk buka</p>
              <p className="font-sans text-sm text-amber">hoki.my</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <PhoneMockup>
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.3rem] bg-amber shadow-lg">
                <span className="display text-3xl text-ink">S</span>
              </div>
              <p className="font-sans text-sm font-bold text-paper">STINGERS</p>
              <div className="h-32 w-32 rounded-xl bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="text-center font-sans text-[0.6rem] text-muted">
                Imbas → Kongsi → Tambah ke Skrin Utama
              </p>
            </div>
          </PhoneMockup>
        </div>
      </Slide>
    </div>
  );
}
