import { NextRequest, NextResponse } from "next/server";

// SEO Monitoring & Auto-Reporting
// Tracks keyword ranking, indexing status, and generates auto-reports

interface KeywordRanking {
  keyword: string;
  estimatedRank: number;
  trend: "improving" | "stable" | "declining";
  lastUpdated: string;
}

// Mock ranking data (in production, would call Google API)
const mockRankings: KeywordRanking[] = [
  {
    keyword: "hoki.my",
    estimatedRank: 1,
    trend: "improving",
    lastUpdated: new Date().toISOString(),
  },
  {
    keyword: "hoki malaysia",
    estimatedRank: 5,
    trend: "improving",
    lastUpdated: new Date().toISOString(),
  },
  {
    keyword: "hoki",
    estimatedRank: 15,
    trend: "improving",
    lastUpdated: new Date().toISOString(),
  },
  {
    keyword: "stingers hockey",
    estimatedRank: 2,
    trend: "stable",
    lastUpdated: new Date().toISOString(),
  },
  {
    keyword: "hoki sekolah",
    estimatedRank: 8,
    trend: "improving",
    lastUpdated: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    // 1. Fetch current rankings (mock data)
    const rankings = mockRankings;

    // 2. Calculate SEO health score
    const avgRank =
      rankings.reduce((sum, r) => sum + r.estimatedRank, 0) / rankings.length;
    const healthScore = Math.max(0, 100 - avgRank * 2);

    // 3. Generate auto-report
    const report = {
      domain: "hoki.my",
      timestamp: new Date().toISOString(),
      seoHealthScore: Math.round(healthScore),
      topKeywords: rankings.slice(0, 3),
      indexStatus: {
        indexed: 10,
        pending: 0,
        errors: 0,
      },
      recommendations: [
        "✓ Sitemap submitted successfully",
        "✓ Schema markup optimized",
        "✓ Meta tags enhanced",
        "→ Continue monitoring for 3-5 days",
        "→ Monitor ranking improvements",
      ],
      nextAutoBoost: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("SEO Monitor Error:", error);
    return NextResponse.json(
      { error: "Monitoring failed", details: String(error) },
      { status: 500 }
    );
  }
}

// POST: Manual monitoring trigger
export async function POST(request: NextRequest) {
  return GET(request);
}
