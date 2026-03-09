// ============================================================
// POST /api/analyze — Check a single website
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { analyzeWebsite } from "@/lib/website-analyzer";
import { analyzeUrlSchema } from "@/lib/validations";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

/** Block private/internal IPs and cloud metadata endpoints */
function isBlockedUrl(urlStr: string): boolean {
  try {
    const url = new URL(
      urlStr.startsWith("http") ? urlStr : `https://${urlStr}`
    );

    // Only allow http/https schemes
    if (!["http:", "https:"].includes(url.protocol)) {
      return true;
    }

    const hostname = url.hostname.toLowerCase();

    // Block localhost variants
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "0.0.0.0"
    ) {
      return true;
    }

    // Block cloud metadata endpoints
    if (
      hostname === "169.254.169.254" ||
      hostname === "metadata.google.internal" ||
      hostname === "metadata.google.com"
    ) {
      return true;
    }

    // Block private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    const ipParts = hostname.split(".").map(Number);
    if (ipParts.length === 4 && ipParts.every((p) => !isNaN(p))) {
      if (ipParts[0] === 10) return true;
      if (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31)
        return true;
      if (ipParts[0] === 192 && ipParts[1] === 168) return true;
      if (ipParts[0] === 169 && ipParts[1] === 254) return true; // Link-local
    }

    return false;
  } catch {
    return true; // Block unparseable URLs
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute
    const key = getRateLimitKey(request, "analyze");
    const { limited } = rateLimit(key, 10, 10 / 60);
    if (limited) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate URL format
    const parsed = analyzeUrlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // SSRF protection: block internal/private URLs
    if (isBlockedUrl(parsed.data.url)) {
      return NextResponse.json(
        { error: "URL not allowed" },
        { status: 400 }
      );
    }

    const analysis = await analyzeWebsite(parsed.data.url);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze website" },
      { status: 500 }
    );
  }
}
