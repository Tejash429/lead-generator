// ============================================================
// GET /api/leads/export — Export leads as CSV
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const city = searchParams.get("city");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (category) where.category = category;

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { savedAt: "desc" },
    });

    if (leads.length === 0) {
      return NextResponse.json(
        { error: "No leads found to export" },
        { status: 404 }
      );
    }

    // Transform to CSV-friendly format
    const csvData = leads.map((lead) => ({
      "Business Name": lead.businessName,
      "Phone": lead.phone ?? "N/A",
      "Address": lead.address,
      "Website": lead.website ?? "No website",
      "Website Status": lead.websiteStatus ?? "Not checked",
      "Lead Score": lead.leadScore ?? "N/A",
      "Rating": lead.rating ?? "N/A",
      "Review Count": lead.ratingCount ?? "N/A",
      "Category": lead.category,
      "City": lead.city,
      "Lead Status": lead.status,
      "Notes": lead.notes ?? "",
      "Saved On": new Date(lead.savedAt).toLocaleDateString(),
    }));

    const csv = Papa.unparse(csvData);

    // Return as downloadable CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export leads" },
      { status: 500 }
    );
  }
}
