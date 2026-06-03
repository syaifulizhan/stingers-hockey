import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Benarkan next/image optimumkan gambar dari Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
