import type { Slot } from '../api/types';
import { formatLocalTime, minutesLabel } from '../lib/time';
import { TypeBadge } from './Feedback';

export function SlotList({
  slots,
  timezone,
  selectedStart,
  onSelect,
}: {
  slots: Slot[];
  timezone: string;
  selectedStart?: string;
  onSelect: (slot: Slot) => void;
}) {
  if (slots.length === 0) {
    return (
      <p className="muted-copy">No slots available for this day. Try another date or type.</p>
    );
  }

  return (
    <ul className="slot-list">
      {slots.map((slot) => {
        const selected = selectedStart === slot.start;
        return (
          <li key={slot.start}>
            <button
              type="button"
              className={selected ? 'slot-row selected' : 'slot-row'}
              onClick={() => onSelect(slot)}
            >
              <span className="slot-when">
                <strong>{formatLocalTime(slot.start, timezone)}</strong>
                <span className="muted-copy">
                  – {formatLocalTime(slot.end, timezone)}
                </span>
              </span>
              <span className="slot-side">
                <TypeBadge type={slot.type} />
                <span className="duration-pill">{minutesLabel(slot.durationMinutes)}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
