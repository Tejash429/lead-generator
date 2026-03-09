// ============================================================
// Website Analyzer
// Checks if a business website exists, is reachable, and fast
// ============================================================

import type { WebsiteAnalysis } from "@/types";

/** Timeout for website checks (ms) */
const FETCH_TIMEOUT = 8000;

/** Websites slower than this are "slow" (ms) */
const SLOW_THRESHOLD = 5000;

/**
 * Analyze a website URL: check if it exists, measure load time,
 * detect obvious signs of an outdated site.
 */
export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  if (!url) {
    return {
      url: "",
      status: "missing",
      loadTimeMs: null,
      statusCode: null,
      isOutdated: false,
      reason: "No website listed",
    };
  }

  // Normalize URL
  let normalizedUrl = url;
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(normalizedUrl, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LeadGenerator/1.0; +https://example.com)",
      },
    });

    clearTimeout(timeout);
    const loadTimeMs = Date.now() - start;

    // Read the HTML body for outdated signals
    const html = await response.text();
    const outdatedSignals = checkOutdatedSignals(html);

    // Determine status
    let status: WebsiteAnalysis["status"] = "ok";
    let reason = "Website is live and responsive";

    if (response.status >= 400) {
      status = "error";
      reason = `HTTP ${response.status} error`;
    } else if (loadTimeMs > SLOW_THRESHOLD) {
      status = "slow";
      reason = `Website took ${(loadTimeMs / 1000).toFixed(1)}s to load`;
    } else if (outdatedSignals.length > 0) {
      status = "slow"; // treat outdated as a lead opportunity
      reason = outdatedSignals.join("; ");
    }

    return {
      url: normalizedUrl,
      status,
      loadTimeMs,
      statusCode: response.status,
      isOutdated: outdatedSignals.length > 0,
      reason,
    };
  } catch (error) {
    const loadTimeMs = Date.now() - start;

    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        url: normalizedUrl,
        status: "slow",
        loadTimeMs,
        statusCode: null,
        isOutdated: false,
        reason: `Website timed out after ${FETCH_TIMEOUT / 1000}s`,
      };
    }

    return {
      url: normalizedUrl,
      status: "error",
      loadTimeMs,
      statusCode: null,
      isOutdated: false,
      reason: `Cannot reach website: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Check HTML for signs of an outdated website:
 * - No viewport meta tag (not mobile-friendly)
 * - Uses old frameworks/patterns
 * - Very small page (placeholder/parking page)
 */
function checkOutdatedSignals(html: string): string[] {
  const signals: string[] = [];
  const lower = html.toLowerCase();

  // No viewport = not mobile-responsive
  if (!lower.includes("viewport")) {
    signals.push("Not mobile-friendly (no viewport meta tag)");
  }

  // Very small page content (likely a parking/placeholder page)
  if (html.length < 2000) {
    signals.push("Very minimal content (possible placeholder page)");
  }

  // Detects domain parking pages
  const parkingSignals = [
    "this domain",
    "domain is for sale",
    "buy this domain",
    "parked domain",
    "godaddy",
    "coming soon",
    "under construction",
    "site not published",
  ];
  for (const sig of parkingSignals) {
    if (lower.includes(sig)) {
      signals.push("Appears to be a parked/placeholder domain");
      break;
    }
  }

  // Uses very old HTML patterns
  if (lower.includes("<table") && lower.split("<table").length > 5) {
    signals.push("Uses table-based layout (outdated design)");
  }

  // No HTTPS in final URL is a quality signal but we check the input URL
  if (!lower.includes("https")) {
    // minor signal, don't add by itself
  }

  return signals;
}

/**
 * Batch analyze multiple websites with concurrency control
 */
export async function analyzeWebsites(
  urls: (string | null)[]
): Promise<Map<string, WebsiteAnalysis>> {
  const results = new Map<string, WebsiteAnalysis>();
  const CONCURRENCY = 5;

  const urlsToCheck = urls.filter((u): u is string => u !== null && u !== "");

  for (let i = 0; i < urlsToCheck.length; i += CONCURRENCY) {
    const batch = urlsToCheck.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(analyzeWebsite));
    for (const result of batchResults) {
      results.set(result.url, result);
    }
  }

  return results;
}
