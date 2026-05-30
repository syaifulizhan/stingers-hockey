// Honeycomb pattern overlay — corak sarang lebah (tema kelulut).
// SVG hexagon grid yang dijana secara deterministik. Server component (tiada state).

type HoneycombProps = {
  className?: string;
  /** opacity keseluruhan corak (default 0.07 ikut spec) */
  opacity?: number;
  /** saiz hexagon dalam unit viewBox */
  radius?: number;
  color?: string;
};

function buildHexGrid(radius: number, width: number, height: number) {
  const polys: string[] = [];
  const dx = 1.5 * radius; // jarak mendatar antara pusat (flat-top)
  const dy = Math.sqrt(3) * radius; // jarak menegak
  const cols = Math.ceil(width / dx) + 2;
  const rows = Math.ceil(height / dy) + 2;

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const cx = col * dx;
      const cy = row * dy + (col % 2 ? dy / 2 : 0);
      const pts: string[] = [];
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 180) * (60 * k);
        const x = cx + radius * Math.cos(a);
        const y = cy + radius * Math.sin(a);
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      polys.push(pts.join(" "));
    }
  }
  return polys;
}

export default function Honeycomb({
  className = "",
  opacity = 0.07,
  radius = 26,
  color = "var(--amber)",
}: HoneycombProps) {
  const W = 600;
  const H = 600;
  const polys = buildHexGrid(radius, W, H);

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
    >
      <g fill="none" stroke={color} strokeWidth={1.2}>
        {polys.map((p, i) => (
          <polygon key={i} points={p} />
        ))}
      </g>
    </svg>
  );
}
