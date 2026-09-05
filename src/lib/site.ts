// Data laman yang dikongsi antara Navigation, Footer, dll.

export const navLinks = [
  { label: "Tentang", labelEn: "About", href: "/#tentang" },
  { label: "Latihan", labelEn: "Training", href: "/#latihan" },
  { label: "Logo", labelEn: "Logo", href: "/#logo" },
  { label: "Jersi", labelEn: "Jersey", href: "/#jersi" },
  { label: "Berita", labelEn: "News", href: "/berita" },
  { label: "Legasi", labelEn: "Legacy", href: "/legasi" },
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

// Profil sosial. Biarkan kosong sehingga alamat sebenar diketahui.
//
// Nilai-nilai ini dahulunya "https://facebook.com/" dan seumpamanya — halaman
// UTAMA rangkaian tersebut, bukan profil pasukan. Tiga ikon di footer semuanya
// menghantar pengunjung ke Facebook.com. Ia juga akan menjadi jawapan yang
// salah kepada `sameAs` dalam structured data: memberitahu Google bahawa
// pasukan ini "juga dikenali sebagai" facebook.com mengelirukan pengecaman
// entiti dan bukannya membantu.
//
// Footer menyembunyikan mana-mana ikon yang alamatnya kosong, jadi mengisi
// satu baris di sini sudah cukup untuk ia muncul semula.
export const social = {
  facebook: "",
  instagram: "",
  x: "",
};

/** Profil yang benar-benar wujud — untuk `sameAs` structured data. */
export const socialSebenar = Object.values(social).filter(Boolean);
