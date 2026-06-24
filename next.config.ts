import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
    // Cache gambar Supabase selama 1 tahun di CDN Vercel.
    minimumCacheTTL: 31536000,
    // Sajikan WebP/AVIF kepada pelayar yang menyokong.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
