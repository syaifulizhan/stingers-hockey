"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  draggable?: boolean;
};

// FaceDetector ialah API eksperimen (Shape Detection) — tiada dalam lib TS rasmi.
type FaceBox = { boundingBox: { x: number; y: number; width: number; height: number } };
type FaceDetectorLike = { detect: (src: CanvasImageSource) => Promise<FaceBox[]> };

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export default function SmartImg({ src, alt, className, draggable }: Props) {
  const [pos, setPos] = useState("50% 50%");
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Pusatkan crop pada muka yang dikesan; jatuh balik ke heuristik bila gagal.
  const focusOnFaces = async (img: HTMLImageElement) => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return false;

    const Ctor = (window as unknown as { FaceDetector?: new () => FaceDetectorLike })
      .FaceDetector;
    if (!Ctor) return false;

    try {
      const faces = await new Ctor().detect(img);
      if (!faces.length) return false;

      // Purata pusat semua muka yang dikesan.
      let cx = 0;
      let cy = 0;
      for (const f of faces) {
        cx += f.boundingBox.x + f.boundingBox.width / 2;
        cy += f.boundingBox.y + f.boundingBox.height / 2;
      }
      cx /= faces.length;
      cy /= faces.length;

      setPos(`${clamp((cx / w) * 100)}% ${clamp((cy / h) * 100)}%`);
      return true;
    } catch {
      // SecurityError (gambar cross-origin), tak disokong, dll. — guna fallback.
      return false;
    }
  };

  // Heuristik tanpa ML: portrait → muka biasanya di atas.
  const heuristic = (img: HTMLImageElement) => {
    if (img.naturalHeight > img.naturalWidth * 1.1) {
      setPos("50% 25%");
    } else {
      setPos("50% 50%");
    }
  };

  const handle = async (img: HTMLImageElement) => {
    const detected = await focusOnFaces(img);
    if (!detected) heuristic(img);
  };

  // Jika gambar sudah dalam cache, onLoad mungkin tak cetus — kendali di sini juga.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth) void handle(img);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      onLoad={(e) => void handle(e.currentTarget)}
      draggable={draggable}
      className={className}
      style={{ objectPosition: pos }}
    />
  );
}
