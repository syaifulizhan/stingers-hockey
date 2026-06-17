// Data laman yang dikongsi antara Navigation, Footer, dll.

export const navLinks = [
  { label: "Tentang", labelEn: "About", href: "/#tentang" },
  { label: "Latihan", labelEn: "Training", href: "/#latihan" },
  { label: "Logo", labelEn: "Logo", href: "/#logo" },
  { label: "Jersi", labelEn: "Jersey", href: "/#jersi" },
  { label: "Berita", labelEn: "News", href: "/berita" },
  { label: "Live", labelEn: "Live", href: "/live" },
  { label: "Keputusan", labelEn: "Results", href: "/keputusan" },
  { label: "Tempahan", labelEn: "Order", href: "/tempahan" },
  { label: "Hubungi", labelEn: "Contact", href: "/#hubungi" },
] as const;

export const contact = {
  phone: "+03-8941 3905",
  phoneHref: "tel:+60389413905",
  email: "hstingers@gmail.com",
  address:
    "Persiaran Desaminium 1, Taman Desaminium, 43300 Seri Kembangan, Selangor",
};

export const social = {
  facebook: "https://facebook.com/", // TODO: pautan sebenar
  instagram: "https://instagram.com/", // TODO: pautan sebenar
  x: "https://x.com/", // TODO: pautan sebenar
};
