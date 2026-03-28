import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

const pitchSchema = z.object({
  businessName: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  reviewCount: z.number().nullable(),
  rating: z.number().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const key = getRateLimitKey(request, "generate-pitch");
    const { limited } = rateLimit(key, 10, 10 / 60);
    if (limited) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Groq API key not configured. Add GROQ_API_KEY to .env" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const parsed = pitchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { businessName, category, city, reviewCount, rating } = parsed.data;
    const categoryLabel = category.replace(/_/g, " ");

    const prompt = `Write a short cold email (under 100 words) from a freelance web developer named Tejash to ${businessName}, a ${categoryLabel} in ${city} with ${reviewCount ?? "unknown"} Google reviews and a ${rating ?? "unknown"} star rating. They have no website. Offer to build one. Sound human and specific, not like a template. Mention their review count naturally as a credibility signal. One soft CTA (quick call or reply). Sign off as Tejash. Just the email body, no subject line.`;

    const groq = new Groq({ apiKey });
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const email = response.choices[0]?.message?.content ?? "";

    if (!email) {
      return NextResponse.json(
        { error: "Model returned an empty response. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error("Generate pitch error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    const is429 = message.includes("429") || message.includes("rate");
    return NextResponse.json(
      {
        error: is429
          ? "Rate limit reached. Wait a moment and try again."
          : "Failed to generate pitch email.",
      },
      { status: is429 ? 429 : 500 }
    );
  }
}
