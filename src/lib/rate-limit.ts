/**
 * Rate Limiting Utility
 * Handles calendar-day (midnight rollover) and hourly rate limit resets.
 */

export function isRateLimitExpired(
  resetAt: Date | string | null | undefined,
  window: string | null | undefined
): boolean {
  if (!resetAt) return true;
  const resetDate = new Date(resetAt);
  if (isNaN(resetDate.getTime())) return true;

  const now = new Date();

  // If window is hourly
  if (window === "hours" || window === "hour") {
    const oneHourMs = 60 * 60 * 1000;
    return (now.getTime() - resetDate.getTime()) >= oneHourMs;
  }

  // Calendar Day (Midnight Reset):
  // Expired if the current calendar day is different from resetDate's day,
  // OR if 24 hours have elapsed.
  const isDifferentCalendarDay =
    now.getFullYear() !== resetDate.getFullYear() ||
    now.getMonth() !== resetDate.getMonth() ||
    now.getDate() !== resetDate.getDate();

  const isMoreThan24Hours = (now.getTime() - resetDate.getTime()) >= 24 * 60 * 60 * 1000;

  return isDifferentCalendarDay || isMoreThan24Hours;
}

/**
 * Calculates effective hits for a license.
 * If the rate limit window has expired, returns 0 instead of stale database hits.
 */
export function getEffectiveRateLimitHits(license: {
  rateLimit?: number | null;
  rateLimitHits?: number | null;
  rateLimitWindow?: string | null;
  rateLimitResetAt?: Date | string | null;
}): number {
  if (!license.rateLimit || !license.rateLimitWindow) {
    return license.rateLimitHits || 0;
  }

  if (isRateLimitExpired(license.rateLimitResetAt, license.rateLimitWindow)) {
    return 0;
  }

  return license.rateLimitHits || 0;
}
