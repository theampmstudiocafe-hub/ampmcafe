interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Sliding window in-memory rate limiter.
 * In multi-node production deployments, this can be connected to Redis / Upstash
 * via the same interface.
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { key, limit, windowSeconds } = options;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const existing = memoryStore.get(key);

  if (!existing || now > existing.resetAt) {
    const record: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    memoryStore.set(key, record);
    return {
      success: true,
      remaining: limit - 1,
      resetAt: record.resetAt,
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}
