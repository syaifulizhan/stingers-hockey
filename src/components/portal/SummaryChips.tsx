// Strip ringkasan (5 kotak) — dikongsi oleh Ringkasan Saya & Ringkasan Pemain.
export default function SummaryChips({
  chips,
}: {
  chips: { label: string; value: string }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {chips.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-line bg-bg-soft/50 px-3 py-3 text-center"
        >
          <div className="display text-2xl text-amber">{c.value}</div>
          <div className="font-sans text-[0.65rem] uppercase tracking-wide text-muted">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
