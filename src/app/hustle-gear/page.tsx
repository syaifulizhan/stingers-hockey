import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import OrderForm from "@/components/OrderForm";
import Footer from "@/components/Footer";
import HustleGearIntro from "@/components/hustle-gear/HustleGearIntro";

export const metadata: Metadata = {
  title: "Tempah Hustle Gear — Stingers Hockey",
  description:
    "Borang tempahan training kit rasmi Stingers Hockey 2026 — Hustle Gear.",
};

export default function HustleGearPage() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        <HustleGearIntro />
        <OrderForm />
      </main>
      <Footer />
    </>
  );
}
