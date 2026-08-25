export const DEFAULT_DAILY_LIMIT = 5;

/**
 * Computes the user's effective daily limit based on the current UTC date.
 * If the user's last generation was on a previous day, their limit resets to 5.
 */
export function getEffectiveDailyLimit(profile: {
  daily_limit?: number | null;
  last_generation_date?: string | null;
  byok_key?: string | null;
} | null | undefined): number {
  if (!profile) return DEFAULT_DAILY_LIMIT;

  const today = new Date().toISOString().split("T")[0];
  const lastDate = profile.last_generation_date;

  // If user has not generated today, reset to standard 5 free daily generations
  if (lastDate !== today) {
    return DEFAULT_DAILY_LIMIT;
  }

  return typeof profile.daily_limit === "number" ? profile.daily_limit : DEFAULT_DAILY_LIMIT;
}
