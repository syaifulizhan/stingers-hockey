import { redirect } from "next/navigation";

// Borang lama digantikan oleh Tempahan Pasukan (/tempahan). Halakan ke sana.
export default function HustleGearPage() {
  redirect("/tempahan");
}
