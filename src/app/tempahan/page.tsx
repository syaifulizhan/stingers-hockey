import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import OrderShop from "@/components/shop/OrderShop";
import { createPublicSupabase } from "@/lib/supabase/public";

// Sentiasa segar — harga/produk boleh berubah dari panel admin.
export const dynamic = "force-dynamic";

export default async function TempahanPage() {
  const supabase = createPublicSupabase();
  const [pRes, vRes, eRes, sRes] = await Promise.all([
    supabase.from("shop_products").select("*").eq("active", true),
    supabase.from("shop_variants").select("*").eq("active", true).order("sort_order", { ascending: true }),
    supabase.from("jersey_editions").select("*").eq("for_sale", true).eq("kind", "jersi").order("sort_order", { ascending: true }),
    supabase.from("shop_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  return (
    <>
      <Navigation />
      <main className="flex-1">
        <OrderShop
          products={(pRes.data ?? []) as never}
          variants={(vRes.data ?? []) as never}
          editions={(eRes.data ?? []) as never}
          settings={(sRes.data ?? {}) as never}
        />
      </main>
      <Footer />
    </>
  );
}
