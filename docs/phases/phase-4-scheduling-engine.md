# Phase 4 — Scheduling engine

## Goal

`GET /doctors/:id/availability?date=&type=` returns correctly-sized bookable slots, including the dynamic gap-fill treatments. This is the core endpoint of the entire product — both clients render whatever it returns and neither computes slots locally.

## Depends on

[Phase 3](./phase-3-working-hours.md). Read the [scheduling engine specification](../architecture.md#scheduling-engine-specification) in full before starting; this phase implements it rather than restating it.

## Why this phase is different

Everything before this was CRUD, where a mistake surfaces immediately as a wrong field or a failed request. Here a mistake surfaces as a slot that looks plausible but leaves an unfillable ten-minute hole in a doctor's day, or as two appointments that quietly overlap. The failures are subtle and they are discovered by the clinic, not by you.

The mitigation is structural: the algorithm is a pure function with no database access, and it is written and verified against the worked example before any endpoint is wired to it.

## Files to create

```
src/modules/availability/
  availability.module.ts
  availability.controller.ts
  availability.service.ts
  slot-calculator.service.ts
  interfaces/slot.interface.ts
  interfaces/interval.interface.ts
  dto/availability-query.dto.ts
  dto/slot-response.dto.ts
  dto/availability-response.dto.ts
```

`slot-calculator.service.ts` holds the pure logic. `availability.service.ts` does the loading and the timezone work. Keeping them in separate files is not ceremony — it is what makes the risky part readable in isolation.

## The pure calculator

`SlotCalculatorService.computeSlots(input: SlotInput): Slot[]` takes everything it needs as arguments:

```ts
export interface Interval {
  start: Date;
  end: Date;
}

export interface Slot {
  start: Date;
  end: Date;
  durationMinutes: number;
  type: AppointmentType;
}

export interface SlotInput {
  window: Interval | null;
  busy: Array<Interval & { type: AppointmentType }>;
  settings: ClinicSchedulingSettings;
  type: AppointmentType;
}
```

Rules that keep it pure, all of which matter:

- No injected repositories or models.
- No `new Date()` or `Date.now()` inside it. "Is this slot in the past" is a filter the caller applies afterwards, using a clock it controls.
- No `luxon` calls. By this point everything is an absolute UTC instant and the arithmetic is plain millisecond math.
- No exceptions thrown for empty input. A `null` window returns `[]`.

### Step 1 — free intervals

```
busyExpanded = busy.map(b => ({
  start: b.start - bufferMinutes,
  end:   b.end   + bufferMinutes,
}))
```

Sort by start, merge any that touch or overlap, clip to the window, then subtract from the window to get the free intervals.

Merge intervals that merely touch (`next.start <= current.end`), not only those that strictly overlap. Otherwise a back-to-back pair produces a zero-length free interval between them, and zero-length intervals cause slots of duration zero to appear at boundaries.

Apply the buffer symmetrically and remember it is `0` in the MVP, so this expansion is a no-op today. Write it anyway. Retrofitting buffers into a merge routine that assumed they were absent is exactly the rewrite that config value exists to avoid.

### Step 2a — consultation slots

For each free interval, walk a cursor from the start in `consultationDurationMinutes` steps, emitting a slot while `cursor + duration <= intervalEnd`.

### Step 2b — treatment slots

Implement the four-step algorithm from [architecture.md](../architecture.md#treatment-slots): resolve the grid anchor, consume the head gap, pack full-length slots, then offer the tail gap.

The grid anchor is the subtle part and the reason a naive implementation fails the worked example. Restated:

> For a free interval starting at `s`, the anchor is the end time of the latest `booked` **treatment** that day ending at or before `s`. If there is none, the anchor is `s`.

Packing 90-minute blocks from the free-interval start looks correct and produces the right answer whenever the day contains no prior treatment. It diverges precisely when a consultation has been carved out of a block that a treatment had already established — which is the case the clinic actually cares about. Stage 3 of the worked example is the test that separates the two implementations: anchoring correctly yields a 75-minute slot at 11:00, while naive packing yields a 90-minute slot at 11:00 that runs to 12:30 and knocks the rest of the day off its boundaries.

This is why `busy` carries `type` even though free-interval computation ignores it. The anchor lookup needs to distinguish treatments from consultations.

Guard the loop against non-termination. If a computed duration is ever zero or negative, break rather than advancing by it. A defect elsewhere should produce an empty result, not a hung request holding a worker.

## Loading and orchestration

`AvailabilityService.getAvailability(doctorId, date, type)`:

1. `DoctorsService.findActiveDoctorOrFail(doctorId)` — `404` if unknown or inactive.
2. `ClinicsService.getSchedulingSettings()` and the clinic timezone.
3. `WorkingHoursService.resolveWorkingWindow(doctorId, date)`. A `null` window short-circuits to an empty slot list with `isWorkingDay: false` — a day off is a valid answer, not an error.
4. Load `booked` appointments for that doctor overlapping the window.
5. Call `computeSlots`.
6. Filter out slots starting in the past, plus a small lead time.
7. Map to the response DTO.

The appointment query must catch appointments that **overlap** the window, not merely start inside it:

```ts
{ doctorId, status: 'booked', startTime: { $lt: window.end }, endTime: { $gt: window.start } }
```

Querying on `startTime` alone misses an appointment that began before the window opened and is still running into it, and that appointment's time would be offered to someone else.

Past-slot filtering belongs here, not in the calculator. Today's request should not offer 09:00 at 14:00. Use a lead time from config — 15 minutes is reasonable — so a patient cannot book something starting ninety seconds from now.

## Endpoint

### `GET /doctors/:id/availability?date=YYYY-MM-DD&type=consultation|treatment`

Any authenticated role. Both clients call it: mobile for the patient booking flow, web for staff adding a walk-in.

`AvailabilityQueryDto` validates `date` as a `YYYY-MM-DD` string that is a real calendar date, and `type` as the `AppointmentType` enum. Both are required — guessing a default date or type produces confusing results. Reject dates more than a configured horizon ahead, 90 days by default, so a client cannot request the year 2199.

Response:

```json
{
  "doctorId": "652f...",
  "date": "2026-09-15",
  "type": "treatment",
  "timezone": "Asia/Yerevan",
  "isWorkingDay": true,
  "slots": [
    { "start": "2026-09-15T07:00:00.000Z", "end": "2026-09-15T08:15:00.000Z", "durationMinutes": 75, "type": "treatment" },
    { "start": "2026-09-15T08:15:00.000Z", "end": "2026-09-15T09:45:00.000Z", "durationMinutes": 90, "type": "treatment" }
  ]
}
```

`isWorkingDay` distinguishes "the doctor is off" from "fully booked". They need different empty states — one suggests another date, the other suggests another doctor — and a client cannot tell them apart from an empty array alone.

`durationMinutes` is per slot and authoritative. Document this loudly in the `@ApiProperty` description: a client that hardcodes 90 minutes for treatments will misreport the 75-minute slots, which is exactly the support ticket the spec calls out.

## Verification

No automated tests are being written, so verify by hand against the worked example in [architecture.md](../architecture.md#worked-example) before moving on. Seed one doctor working 09:00–18:00, then walk the three stages, comparing the returned slots to the documented expectations at each one.

The single check that matters most: after booking the 09:15 treatment and then a 10:45 consultation, a treatment query must return a **75-minute slot at 11:00** followed by 90-minute slots at 12:15, 13:45 and 15:15, and a 75-minute tail at 16:45. Any other result means the grid anchor is wrong.

Also spot-check the degenerate cases, since each one has a plausible wrong answer:

- A day off returns `isWorkingDay: false` and no slots.
- A fully booked day returns `isWorkingDay: true` and no slots.
- A free gap shorter than `minTreatmentDurationMinutes` offers consultations but no treatments.
- A gap of exactly `minTreatmentDurationMinutes` **is** offered; the comparison is inclusive.
- Today's date offers no slots that have already started.

## Done when

- The three stages of the worked example reproduce exactly, including the 75-minute slot at 11:00.
- Slot durations vary within a single response and every slot carries its own `durationMinutes`.
- `SlotCalculatorService` has no constructor dependencies and no reference to `Date.now`, `new Date()`, Mongoose, or `luxon`.
- A day off and a fully booked day are distinguishable through `isWorkingDay`.
- An appointment starting before the window and running into it removes the time it occupies.
- An unknown or inactive doctor returns `404`; a malformed `date` or an invalid `type` returns `400`.
