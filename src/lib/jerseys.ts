// Legasi Jersi — 13 edisi sejak 2022, disusun terbaru dahulu.
// `image` menunjuk ke /public/images/jerseys/*. Fail mungkin belum wujud;
// komponen galeri akan tunjuk placeholder gradient jika imej tiada.

export type Jersey = {
  id: string;
  name: string; // nama edisi
  year: string;
  tournament: string; // kejohanan
  region: string;
  venue: string;
  image: string; // path relatif dalam /public
  note?: string;
};

export const jerseys: Jersey[] = [
  {
    id: "ventralis-2025",
    name: "Ventralis ed.",
    year: "2025",
    tournament: "KATMO",
    region: "Petaling Perdana",
    venue: "Mini Turf SK Seksyen 20",
    image: "/images/jerseys/ventralis-2025.png",
  },
  {
    id: "apicalis-2025",
    name: "Apicalis ed.",
    year: "2025",
    tournament: "MSSD",
    region: "Petaling Perdana",
    venue: "Stadium Hoki KPM Bangsar",
    image: "/images/jerseys/apicalis-2025.png",
  },
  {
    id: "binghami-2024",
    name: "Binghami ed.",
    year: "2024",
    tournament: "KATMO",
    region: "Petaling Perdana",
    venue: "Mini Turf SK Seksyen 20",
    image: "/images/jerseys/binghami-2024.png",
  },
  {
    id: "itama-2024",
    name: "Itama ed.",
    year: "2024",
    tournament: "MSSD",
    region: "Petaling Perdana",
    venue: "Stadium Hoki KPM Bangsar",
    image: "/images/jerseys/itama-2024.png",
  },
  {
    id: "desaminium-girls-2024",
    name: "Desaminium Girls ed.",
    year: "2024",
    tournament: "MSSD",
    region: "Petaling Perdana",
    venue: "Stadium Hoki KPM Bangsar",
    image: "/images/jerseys/desaminium-girls-2024.png",
  },
  {
    id: "desaminium-girls-alt-2024",
    name: "Desaminium Girls alt. ed.",
    year: "2024",
    tournament: "MSSD",
    region: "Petaling Perdana",
    venue: "Stadium Hoki KPM Bangsar",
    image: "/images/jerseys/desaminium-girls-alt-2024.png",
  },
  {
    id: "dortmund-2023",
    name: "Dortmund ed.",
    year: "2023",
    tournament: "KATMO",
    region: "Petaling Perdana",
    venue: "Mini Turf SK Seksyen 20",
    image: "/images/jerseys/dortmund-2023.png",
  },
  {
    id: "thoracica-2023",
    name: "Thoracica ed.",
    year: "2023",
    tournament: "MSSD",
    region: "Petaling Perdana",
    venue: "Stadium Hoki KPM Bangsar",
    image: "/images/jerseys/thoracica-2023.png",
  },
  {
    id: "desaminium-girls-2023",
    name: "Desaminium Girls ed.",
    year: "2023",
    tournament: "MSSD",
    region: "Petaling Perdana",
    venue: "Stadium Hoki KPM Bangsar",
    image: "/images/jerseys/desaminium-girls-2023.png",
  },
  {
    id: "stingers-desaminium-official-2022",
    name: "Stingers Desaminium ed.",
    year: "2022",
    tournament: "MSSD",
    region: "Petaling Perdana",
    venue: "Stadium Hoki KPM Bangsar",
    image: "/images/jerseys/stingers-desaminium-official-2022.png",
    note: "Jersi Pegawai",
  },
  {
    id: "stingers-desaminium-boys-2022",
    name: "Stingers Desaminium (Boys) ed.",
    year: "2022",
    tournament: "MSSD",
    region: "Petaling Perdana",
    venue: "Stadium Hoki KPM Bangsar",
    image: "/images/jerseys/stingers-desaminium-boys-2022.png",
  },
  {
    id: "stingers-desaminium-girls-2022",
    name: "Stingers Desaminium (Girls) ed.",
    year: "2022",
    tournament: "MSSD",
    region: "Petaling Perdana",
    venue: "Stadium Hoki KPM Bangsar",
    image: "/images/jerseys/stingers-desaminium-girls-2022.png",
  },
  {
    id: "stingers-tournament-2022",
    name: "Stingers Desaminium Tournament ed.",
    year: "2022",
    tournament: "Tournament",
    region: "",
    venue: "",
    image: "/images/jerseys/stingers-tournament-2022.png",
  },
];
