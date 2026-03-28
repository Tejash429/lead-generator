import { NextRequest, NextResponse } from "next/server";
import { getPlaceDetails } from "@/lib/google-places";

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json(
      { error: "placeId is required" },
      { status: 400 }
    );
  }

  try {
    const details = await getPlaceDetails(placeId);
    return NextResponse.json(details);
  } catch (err) {
    console.error("Place details error:", err);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
