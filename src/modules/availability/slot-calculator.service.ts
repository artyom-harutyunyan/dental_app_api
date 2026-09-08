import { Injectable } from '@nestjs/common';

import { AppointmentType } from '../../common/enums/appointment-type.enum';
import { Interval } from './interfaces/interval.interface';
import { BusyInterval, Slot, SlotInput } from './interfaces/slot.interface';

const MS_PER_MINUTE = 60_000;

/**
 * Pure slot calculator. No DB, no clock, no timezone library — only millisecond math
 * over absolute UTC instants supplied by the caller.
 */
@Injectable()
export class SlotCalculatorService {
  computeSlots(input: SlotInput): Slot[] {
    if (!input.window) {
      return [];
    }

    const freeIntervals = this.computeFreeIntervals(
      input.window,
      input.busy,
      input.settings.bufferMinutes,
    );

    if (input.type === AppointmentType.CONSULTATION) {
      return freeIntervals.flatMap((interval) =>
        this.consultationSlots(interval, input.settings.consultationDurationMinutes),
      );
    }

    return freeIntervals.flatMap((interval) =>
      this.treatmentSlots(interval, input.busy, input.settings),
    );
  }

  private computeFreeIntervals(
    window: Interval,
    busy: BusyInterval[],
    bufferMinutes: number,
  ): Interval[] {
    const bufferMs = bufferMinutes * MS_PER_MINUTE;
    const windowStart = window.start.getTime();
    const windowEnd = window.end.getTime();

    const expanded = busy
      .map((item) => ({
        start: item.start.getTime() - bufferMs,
        end: item.end.getTime() + bufferMs,
      }))
      .map((item) => ({
        start: Math.max(item.start, windowStart),
        end: Math.min(item.end, windowEnd),
      }))
      .filter((item) => item.end > item.start)
      .sort((a, b) => a.start - b.start);

    const merged: Array<{ start: number; end: number }> = [];
    for (const item of expanded) {
      const last = merged[merged.length - 1];
      if (!last || item.start > last.end) {
        merged.push({ ...item });
      } else {
        last.end = Math.max(last.end, item.end);
      }
    }

    const free: Interval[] = [];
    let cursor = windowStart;

    for (const block of merged) {
      if (block.start > cursor) {
        free.push({ start: this.fromMs(cursor), end: this.fromMs(block.start) });
      }
      cursor = Math.max(cursor, block.end);
    }

    if (cursor < windowEnd) {
      free.push({ start: this.fromMs(cursor), end: this.fromMs(windowEnd) });
    }

    return free;
  }

  private consultationSlots(interval: Interval, durationMinutes: number): Slot[] {
    if (durationMinutes <= 0) {
      return [];
    }

    const slots: Slot[] = [];
    let cursor = interval.start.getTime();
    const end = interval.end.getTime();
    const durationMs = durationMinutes * MS_PER_MINUTE;

    while (cursor + durationMs <= end) {
      const slotEnd = cursor + durationMs;
      slots.push({
        start: this.fromMs(cursor),
        end: this.fromMs(slotEnd),
        durationMinutes,
        type: AppointmentType.CONSULTATION,
      });
      cursor = slotEnd;
    }

    return slots;
  }

  private treatmentSlots(
    interval: Interval,
    busy: BusyInterval[],
    settings: {
      treatmentDurationMinutes: number;
      minTreatmentDurationMinutes: number;
    },
  ): Slot[] {
    const { treatmentDurationMinutes, minTreatmentDurationMinutes } = settings;
    if (treatmentDurationMinutes <= 0 || minTreatmentDurationMinutes <= 0) {
      return [];
    }

    const s = interval.start.getTime();
    const e = interval.end.getTime();
    const treatmentMs = treatmentDurationMinutes * MS_PER_MINUTE;
    const minMs = minTreatmentDurationMinutes * MS_PER_MINUTE;

    if (e - s < minMs) {
      return [];
    }

    const anchor = this.resolveGridAnchor(s, busy);
    const slots: Slot[] = [];
    let cursor = s;

    // Head gap: free interval begins partway through a grid cell.
    if (anchor < s) {
      const k = Math.floor((s - anchor) / treatmentMs) + 1;
      const nextGrid = anchor + k * treatmentMs;
      const gapEnd = Math.min(nextGrid, e);
      const gapMs = gapEnd - s;

      if (gapMs >= minMs) {
        const durationMinutes = gapMs / MS_PER_MINUTE;
        slots.push({
          start: this.fromMs(s),
          end: this.fromMs(gapEnd),
          durationMinutes,
          type: AppointmentType.TREATMENT,
        });
      }

      if (gapMs > 0) {
        cursor = gapEnd;
      }
    }

    // Full-length slots.
    while (e - cursor >= treatmentMs) {
      const slotEnd = cursor + treatmentMs;
      slots.push({
        start: this.fromMs(cursor),
        end: this.fromMs(slotEnd),
        durationMinutes: treatmentDurationMinutes,
        type: AppointmentType.TREATMENT,
      });
      cursor = slotEnd;
    }

    // Tail gap.
    const remMs = e - cursor;
    if (remMs >= minMs) {
      if (remMs <= 0) {
        return slots;
      }
      slots.push({
        start: this.fromMs(cursor),
        end: this.fromMs(e),
        durationMinutes: remMs / MS_PER_MINUTE,
        type: AppointmentType.TREATMENT,
      });
    }

    return slots;
  }

  /**
   * Anchor = end of the latest treatment ending at or before the free-interval start.
   * Falls back to the free-interval start when no such treatment exists.
   */
  private resolveGridAnchor(freeStartMs: number, busy: BusyInterval[]): number {
    let latestTreatmentEnd: number | null = null;

    for (const item of busy) {
      if (item.type !== AppointmentType.TREATMENT) {
        continue;
      }

      const endMs = item.end.getTime();
      if (endMs <= freeStartMs) {
        if (latestTreatmentEnd === null || endMs > latestTreatmentEnd) {
          latestTreatmentEnd = endMs;
        }
      }
    }

    return latestTreatmentEnd ?? freeStartMs;
  }

  /** Construct a Date from epoch ms without reading the wall clock. */
  private fromMs(ms: number): Date {
    return new Date(ms);
  }
}
