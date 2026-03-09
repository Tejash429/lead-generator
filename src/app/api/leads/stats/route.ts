// ============================================================
// GET /api/leads/stats — Summary stats for leads dashboard
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [total, newCount, contactedCount, convertedCount] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "new" } }),
      prisma.lead.count({ where: { status: "contacted" } }),
      prisma.lead.count({ where: { status: "converted" } }),
    ]);

    return NextResponse.json({
      total,
      new: newCount,
      contacted: contactedCount,
      converted: convertedCount,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
