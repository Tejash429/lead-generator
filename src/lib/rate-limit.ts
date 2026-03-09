// ============================================================
// Simple In-Memory Rate Limiter (Token Bucket)
// ============================================================

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const staleThreshold = now - 10 * 60 * 1000; // 10 min
  for (const [key, entry] of store) {
    if (entry.lastRefill < staleThreshold) {
      store.delete(key);
    }
  }
}

/**
 * Check if a request should be rate-limited.
 *
 * @param key - Unique identifier (e.g., IP + endpoint)
 * @param maxTokens - Maximum burst capacity
 * @param refillRate - Tokens refilled per second
 * @returns { limited: boolean, remaining: number }
 */
export function rateLimit(
  key: string,
  maxTokens: number = 10,
  refillRate: number = 1
): { limited: boolean; remaining: number } {
  cleanup();

  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { tokens: maxTokens - 1, lastRefill: now };
    store.set(key, entry);
    return { limited: false, remaining: entry.tokens };
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - entry.lastRefill) / 1000; // seconds
  entry.tokens = Math.min(maxTokens, entry.tokens + elapsed * refillRate);
  entry.lastRefill = now;

  if (entry.tokens < 1) {
    return { limited: true, remaining: 0 };
  }

  entry.tokens -= 1;
  return { limited: false, remaining: Math.floor(entry.tokens) };
}

/**
 * Get a rate limit key from a request (uses IP or fallback)
 */
export function getRateLimitKey(
  request: Request,
  endpoint: string
): string {
  const forwarded = (request.headers as Headers).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `${ip}:${endpoint}`;
}
