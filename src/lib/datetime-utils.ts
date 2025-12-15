/**
 * Datetime Utilities for UTC handling
 * 
 * These utilities ensure all datetime conversions are done in UTC
 * to avoid timezone-related bugs when communicating with the backend.
 */

/**
 * Convert a date string (YYYY-MM-DD) and time string (e.g., "9:00 AM")
 * to a UTC ISO datetime string for backend API calls.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in "H:MM AM/PM" format
 * @returns ISO 8601 datetime string in UTC (e.g., "2025-12-17T09:00:00.000Z")
 * 
 * @example
 * ```typescript
 * const isoDate = convertToUTCISO("2025-12-17", "9:00 AM");
 * // Returns: "2025-12-17T09:00:00.000Z"
 * ```
 */
export function convertToUTCISO(dateStr: string, timeStr: string): string {
  // Parse time (e.g., "9:00 AM" or "2:30 PM")
  const [time, period] = timeStr.split(' ');
  const timeParts = time.split(':').map(Number);
  let hours = timeParts[0];
  const minutes = timeParts[1];

  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  // Parse date (YYYY-MM-DD)
  const dateParts = dateStr.split('-').map(Number);
  const year = dateParts[0];
  const month = dateParts[1] - 1; // JavaScript months are 0-indexed
  const day = dateParts[2];

  // Create UTC date explicitly using Date.UTC()
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
  
  return utcDate.toISOString();
}

/**
 * Parse a date string in YYYY-MM-DD format as UTC.
 * Useful for getting day of week without timezone shifts.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object representing the date in UTC
 * 
 * @example
 * ```typescript
 * const date = parseDateAsUTC("2025-12-17");
 * const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
 * ```
 */
export function parseDateAsUTC(dateStr: string): Date {
  const dateParts = dateStr.split('-').map(Number);
  return new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0));
}

/**
 * Format a UTC ISO datetime string for display.
 * 
 * @param isoString - ISO 8601 datetime string
 * @param locale - Locale string (default: 'en-US')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatUTCDate(
  isoString: string, 
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }
): string {
  return new Date(isoString).toLocaleDateString(locale, options);
}

/**
 * Format a UTC ISO datetime string for time display.
 * 
 * @param isoString - ISO 8601 datetime string
 * @param locale - Locale string (default: 'en-US')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string
 */
export function formatUTCTime(
  isoString: string,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  }
): string {
  return new Date(isoString).toLocaleTimeString(locale, options);
}

/**
 * Get today's date in YYYY-MM-DD format (UTC).
 * 
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayUTC(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Add days to a date string and return in YYYY-MM-DD format (UTC).
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param days - Number of days to add (can be negative)
 * @returns New date string in YYYY-MM-DD format
 * 
 * @example
 * ```typescript
 * const tomorrow = addDaysUTC("2025-12-17", 1);
 * // Returns: "2025-12-18"
 * ```
 */
export function addDaysUTC(dateStr: string, days: number): string {
  const date = parseDateAsUTC(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Check if a datetime is in the past (UTC).
 * 
 * @param isoString - ISO 8601 datetime string
 * @returns True if the datetime is in the past
 */
export function isInPast(isoString: string): boolean {
  return new Date(isoString).getTime() < Date.now();
}

/**
 * Check if a datetime is in the future (UTC).
 * 
 * @param isoString - ISO 8601 datetime string
 * @returns True if the datetime is in the future
 */
export function isInFuture(isoString: string): boolean {
  return new Date(isoString).getTime() > Date.now();
}

/**
 * Get the time difference between now and a datetime in minutes.
 * 
 * @param isoString - ISO 8601 datetime string
 * @returns Difference in minutes (positive = future, negative = past)
 */
export function getMinutesUntil(isoString: string): number {
  const diffMs = new Date(isoString).getTime() - Date.now();
  return Math.floor(diffMs / (1000 * 60));
}

