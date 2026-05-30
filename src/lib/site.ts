// Data laman yang dikongsi antara Navigation, Footer, dll.

export const navLinks = [
  { label: "Tentang", href: "/#tentang" },
  { label: "Latihan", href: "/#latihan" },
  { label: "Logo", href: "/#logo" },
  { label: "Jersi", href: "/#jersi" },
  { label: "Tempahan", href: "/hustle-gear" },
  { label: "Hubungi", href: "/#hubungi" },
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
