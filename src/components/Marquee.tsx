"use client";

// Marquee strip — scroll mendatar infinite, paused on hover.
// Animasi CSS murni (dihormati oleh prefers-reduced-motion melalui globals).

const items = [
  { text: "Strike Hard", accent: true },
  { text: "Strike Fast", accent: true },
  { text: "Disiplin", accent: false },
  { text: "Semangat", accent: false },
  { text: "Kemahiran", accent: false },
  { text: "Stingers Hockey", accent: true },
];

function Row() {
  return (
    <ul className="flex shrink-0 items-center gap-8 px-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-8">
          <span
            className={`display whitespace-nowrap text-2xl sm:text-3xl ${
              item.accent ? "text-amber" : "text-muted"
            }`}
          >
            {item.text}
          </span>
          <span className="text-amber" aria-hidden="true">
            •
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Marquee() {
  return (
    <div className="group overflow-hidden border-y border-line bg-bg-soft py-4">
      <div className="flex w-max animate-[marquee_24s_linear_infinite] group-hover:[animation-play-state:paused]">
        <Row />
        <Row />
        <Row />
      </div>
    </div>
  );
}
