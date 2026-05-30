// Kecilkan & mampatkan imej di pelayar SEBELUM muat naik — jimat storan Supabase.
// - Skala turun supaya sisi terpanjang ≤ maxDim
// - Tukar ke JPEG kualiti ~0.8
// Bukan imej (cth video) → dikembalikan tanpa ubah.
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) return file; // video/lain — biar je
  if (file.type === "image/gif") return file; // elak rosak animasi

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file; // tak jadi lebih kecil → guna asal

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file; // gagal mampat → guna fail asal
  }
}
