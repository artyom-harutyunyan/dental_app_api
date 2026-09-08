export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatLocalTime(iso: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

export function formatLocalDate(iso: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

export function minutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
