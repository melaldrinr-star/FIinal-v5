/**
 * Normalize any date representation to YYYY-MM-DD.
 *
 * - Returns '' for null / undefined / empty input.
 * - Returns input unchanged if it already matches YYYY-MM-DD.
 * - For ISO timestamps (e.g. "2025-08-01T00:00:00.000Z"), slices the first 10 characters.
 */
export function toDateString(iso: string | undefined | null): string {
  if (!iso) return '';
  // Already YYYY-MM-DD — return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  // ISO timestamp or any longer string — take the date portion
  return iso.slice(0, 10);
}

/**
 * Normalize any time representation to HH:MM.
 *
 * Supabase returns TIME columns as "HH:MM:SS" but the backend schema
 * validates with /^\d{2}:\d{2}$/ (no seconds). This strips the seconds.
 *
 * - Returns '' for null / undefined / empty input.
 * - Returns input unchanged if it already matches HH:MM.
 * - For "HH:MM:SS" or longer, slices the first 5 characters.
 */
export function toTimeString(t: string | undefined | null): string {
  if (!t) return '';
  // Already HH:MM — return as-is
  if (/^\d{2}:\d{2}$/.test(t)) return t;
  // HH:MM:SS (Supabase TIME column) — strip seconds
  return t.slice(0, 5);
}
