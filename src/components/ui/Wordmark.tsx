// Logo teks rasmi: "Stingers" (atas) + "Hockey" (bawah, amber).
// Guna di header, footer, dan portal supaya konsisten di semua tempat.
export default function Wordmark({
  className = "text-xl",
}: {
  className?: string;
}) {
  return (
    <span className={`display flex flex-col leading-none text-paper ${className}`}>
      <span>Stingers</span>
      <span className="text-amber">Hockey</span>
    </span>
  );
}
