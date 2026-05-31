// Graf garis ringkas (SVG, tiada dependency). Titik mengikut urutan masa.
export default function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) {
    return <span className="font-sans text-xs text-muted">Perlu ≥2 ujian untuk graf</span>;
  }
  const w = 140;
  const h = 36;
  const pad = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (h - pad * 2) * (1 - (v - min) / range);
    return [x, y] as const;
  });
  const d = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`)
    .join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg width={w} height={h} className="text-amber" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill="currentColor" />
    </svg>
  );
}
