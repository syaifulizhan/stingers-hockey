import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import OrderShop from "@/components/shop/OrderShop";
import JsonLd from "@/components/JsonLd";
import { createPublicSupabase } from "@/lib/supabase/public";
import { canonical, ogHalaman, SITE_NAME } from "@/lib/seo";
import { breadcrumbs, graf } from "@/lib/jsonld";

// Sentiasa segar — harga/produk boleh berubah dari panel admin.
export const dynamic = "force-dynamic";

// Halaman ini tidak mempunyai metadata langsung sebelum ini, jadi ia mewarisi
// tajuk dan perihal laman utama. Dalam hasil carian ia kelihatan sebagai
// pendua halaman utama — dua entri, tajuk sama, tiada satu pun menyebut jersi.
export const metadata: Metadata = {
  title: `Tempahan Jersi & Hustle Gear — ${SITE_NAME}`,
  description:
    "Tempah jersi hoki rasmi dan Hustle Gear Stingers Hockey, SK Taman Desaminium. Saiz, harga dan slot tempahan musim semasa.",
  alternates: { canonical: canonical("/tempahan") },
  openGraph: ogHalaman({
    title: `Tempahan Jersi & Hustle Gear — ${SITE_NAME}`,
    description:
      "Tempah jersi hoki rasmi dan Hustle Gear Stingers Hockey. Saiz, harga dan slot tempahan musim semasa.",
    path: "/tempahan",
  }),
};

export default async function TempahanPage() {
  const supabase = createPublicSupabase();
  const [pRes, vRes, eRes, sRes, dRes] = await Promise.all([
    supabase.from("shop_products").select("*").eq("active", true),
    supabase.from("shop_variants").select("*").eq("active", true).order("sort_order", { ascending: true }),
    supabase.from("jersey_editions").select("*").eq("for_sale", true).order("sort_order", { ascending: true }),
    supabase.from("shop_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("shop_discounts").select("*").eq("active", true).order("sort_order", { ascending: true }),
  ]);

  return (
    <>
      <JsonLd json={graf(breadcrumbs([{ nama: "Tempahan" }]))} />
      <Navigation />
      <main className="flex-1">
        <OrderShop
          products={(pRes.data ?? []) as never}
          variants={(vRes.data ?? []) as never}
          editions={(eRes.data ?? []) as never}
          settings={(sRes.data ?? {}) as never}
          discounts={(dRes.data ?? []) as never}
        />
      </main>
      <Footer />
    </>
  );
}
