import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TABLE_NAME = "visitor_stats";
const INITIAL_COUNT = 99235;

async function ensureTable() {
  try {
    const { data } = await supabase.from(TABLE_NAME).select("*").limit(1);
    return true;
  } catch {
    return false;
  }
}

async function initializeCount() {
  try {
    const { data } = await supabase
      .from(TABLE_NAME)
      .select("total_count")
      .eq("id", 1)
      .single();

    if (!data) {
      await supabase.from(TABLE_NAME).insert({
        id: 1,
        total_count: INITIAL_COUNT,
      });
      return INITIAL_COUNT;
    }
    return data.total_count;
  } catch {
    return INITIAL_COUNT;
  }
}

export async function GET() {
  try {
    await ensureTable();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("total_count")
      .eq("id", 1)
      .single();

    if (error || !data) {
      const count = await initializeCount();
      return NextResponse.json({ count }, { status: 200 });
    }

    return NextResponse.json({ count: data.total_count }, { status: 200 });
  } catch (err) {
    console.error("Visitor API error:", err);
    return NextResponse.json(
      { count: INITIAL_COUNT, error: "Failed to fetch visitor count" },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable();

    const { data: current } = await supabase
      .from(TABLE_NAME)
      .select("total_count")
      .eq("id", 1)
      .single();

    const newCount = (current?.total_count ?? INITIAL_COUNT) + 1;

    const { data } = await supabase
      .from(TABLE_NAME)
      .update({ total_count: newCount, updated_at: new Date() })
      .eq("id", 1)
      .select("total_count")
      .single();

    return NextResponse.json({ count: data?.total_count ?? newCount }, {
      status: 200,
    });
  } catch (err) {
    console.error("Visitor increment error:", err);
    return NextResponse.json(
      { error: "Failed to increment visitor count" },
      { status: 500 }
    );
  }
}
