"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  draggable?: boolean;
};

export default function SmartImg({ src, alt, className, draggable }: Props) {
  const [pos, setPos] = useState("50% 50%");

  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Gambar portrait (tinggi > lebar) — muka biasanya di bahagian atas.
    if (img.naturalHeight > img.naturalWidth * 1.1) {
      setPos("50% 15%");
    }
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onLoad={onLoad}
      draggable={draggable}
      className={className}
      style={{ objectPosition: pos }}
    />
  );
}
