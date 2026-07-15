// Enhanced schema markup untuk SEO ranking
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Apa itu Stingers Hockey?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stingers Hockey adalah pasukan hoki rasmi SK Taman Desaminium sejak 2017. Kami melatih pemain dengan disiplin, semangat, dan kemahiran tinggi.",
      },
    },
    {
      "@type": "Question",
      name: "Bagaimana cara sertai Stingers Hockey?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Anda boleh sertai pencarian bakat Stingers Hockey 2026. Latihan diadakan setiap Selasa & Rabu (Lelaki) dan Khamis & Jumaat (Perempuan) pada pukul 7:30 pagi hingga 9:30 pagi.",
      },
    },
    {
      "@type": "Question",
      name: "Bagaimana cara menghubungi Stingers Hockey?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hubungi kami di +03-8941 3905 atau hstingers@gmail.com. Lokasi: SK Taman Desaminium, Seri Kembangan, Selangor.",
      },
    },
  ],
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Stingers Hockey",
  url: "https://hoki.my",
  telephone: "+60389413905",
  email: "hstingers@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Persiaran Desaminium 1, Taman Desaminium",
    addressLocality: "Seri Kembangan",
    postalCode: "43300",
    addressCountry: "MY",
  },
  areaServed: ["Selangor", "Malaysia"],
};
