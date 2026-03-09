// ============================================================
// GET /api/search/history — Recent search history
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const searches = await prisma.searchHistory.findMany({
      orderBy: { searchedAt: "desc" },
      take: 8,
    });

    return NextResponse.json({ searches });
  } catch (error) {
    console.error("Search history error:", error);
    return NextResponse.json({ searches: [] });
  }
}
