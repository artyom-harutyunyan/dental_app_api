import { DateTime } from 'luxon';

const CALENDAR_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Converts a clinic-local calendar date + minutes-from-midnight into a UTC Date.
 * Always resolves through luxon so DST transitions are handled correctly.
 */
export function localDateAndMinutesToUtc(
  date: string,
  minutes: number,
  timezone: string,
): Date {
  assertCalendarDate(date);

  return DateTime.fromISO(date, { zone: timezone })
    .startOf('day')
    .plus({ minutes })
    .toUTC()
    .toJSDate();
}

/** Weekday index for a calendar date in the given zone: 0 = Sunday … 6 = Saturday. */
export function weekdayInZone(date: string, timezone: string): number {
  assertCalendarDate(date);

  const weekday = DateTime.fromISO(date, { zone: timezone }).weekday;
  // luxon: 1 = Monday … 7 = Sunday. Convert to JS style 0 = Sunday.
  return weekday === 7 ? 0 : weekday;
}

export function minutesToLabel(minutes: number): string {
  const clamped = Math.max(0, Math.min(1440, Math.floor(minutes)));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function utcToLocalDate(instant: Date, timezone: string): string {
  const iso = DateTime.fromJSDate(instant, { zone: 'utc' }).setZone(timezone).toISODate();
  if (!iso) {
    throw new Error('Failed to convert UTC instant to local date');
  }
  return iso;
}

export function todayInZone(timezone: string): string {
  const iso = DateTime.now().setZone(timezone).toISODate();
  if (!iso) {
    throw new Error('Failed to resolve today in timezone');
  }
  return iso;
}

export function addDaysToCalendarDate(date: string, days: number): string {
  assertCalendarDate(date);
  const iso = DateTime.fromISO(date, { zone: 'utc' }).plus({ days }).toISODate();
  if (!iso) {
    throw new Error('Failed to add days to calendar date');
  }
  return iso;
}

export function isValidCalendarDate(date: string): boolean {
  if (!CALENDAR_DATE_RE.test(date)) {
    return false;
  }

  const parsed = DateTime.fromISO(date, { zone: 'utc' });
  return parsed.isValid && parsed.toISODate() === date;
}

export function assertCalendarDate(date: string): void {
  if (!isValidCalendarDate(date)) {
    throw new Error(`Invalid calendar date: ${date}`);
  }
}
