"use client";

import Image from "next/image";
import { useState } from "react";

// SmartImage: guna next/image, tetapi jika fail tiada (404) atau gagal dimuat,
// tunjuk placeholder gradient yang sopan dengan label — supaya laman tidak crash
// sebelum user eksport aset sebenar dari Canva.
//
// TODO: buang fallback bila semua aset di /public/images sudah lengkap (opsional).

type SmartImageProps = {
  src: string;
  alt: string;
  label?: string; // teks ditunjuk dalam placeholder
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** objek-fit untuk imej (default cover) */
  fit?: "cover" | "contain";
};

export default function SmartImage({
  src,
  alt,
  label,
  className = "",
  imgClassName = "",
  sizes = "100vw",
  priority = false,
  fit = "cover",
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          onError={() => setFailed(true)}
          className={`object-${fit} ${imgClassName}`}
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-soft via-ink to-black"
        >
          <span className="display px-4 text-center text-2xl text-outline-amber sm:text-3xl">
            {label ?? alt}
          </span>
        </div>
      )}
    </div>
  );
}
