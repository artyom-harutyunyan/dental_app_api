import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ApiError } from '../api/client';
import { api } from '../api/services';
import type { AppointmentType, Doctor, Slot } from '../api/types';
import { ErrorBanner, SuccessBanner, Spinner } from '../components/Feedback';
import { SlotList } from '../components/SlotList';
import { useAuth } from '../context/AuthContext';
import { formatLocalDate, formatLocalTime, minutesLabel, todayLocal } from '../lib/time';

export function BookPage() {
  const { token, clinic } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const timezone = clinic?.timezone || 'Asia/Yerevan';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState(params.get('doctorId') || '');
  const [type, setType] = useState<AppointmentType>('consultation');
  const [date, setDate] = useState(todayLocal());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [notes, setNotes] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void api.listDoctors(token).then((list) => {
      setDoctors(list);
      if (!doctorId && list[0]) setDoctorId(list[0].id);
    });
  }, [token, doctorId]);

  useEffect(() => {
    if (!token || !doctorId || !date) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSelected(null);
    setError(null);
    (async () => {
      try {
        const res = await api.availability(token, doctorId, date, type);
        if (cancelled) return;
        setSlots(res.slots);
        setIsWorkingDay(res.isWorkingDay);
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setError(err instanceof ApiError ? err.message : 'Could not load slots');
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, doctorId, date, type]);

  const doctorName = useMemo(
    () => doctors.find((d) => d.id === doctorId)?.name || 'Doctor',
    [doctors, doctorId],
  );

  async function onConfirm(e: FormEvent) {
    e.preventDefault();
    if (!token || !selected) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const appt = await api.createAppointment(token, {
        doctorId,
        type: selected.type,
        startTime: selected.start,
        notes: notes.trim() || undefined,
      });
      setSuccess(
        `Booked ${formatLocalDate(appt.startTime, timezone)} at ${formatLocalTime(appt.startTime, timezone)} (${minutesLabel(appt.durationMinutes)}) with ${doctorName}.`,
      );
      setTimeout(() => navigate('/app/appointments'), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Booking failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <div>
          <p className="eyebrow">New appointment</p>
          <h1>Book a slot</h1>
          <p className="lede">Every slot shows its real duration — treatments are not always 90 minutes.</p>
        </div>
      </header>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <form className="book-layout" onSubmit={onConfirm}>
        <section className="surface">
          <h2>Details</h2>
          <div className="form-grid">
            <label>
              <span>Doctor</span>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Visit type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AppointmentType)}
              >
                <option value="consultation">Consultation</option>
                <option value="treatment">Treatment</option>
              </select>
            </label>
            <label>
              <span>Date</span>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="full">
              <span>Notes (optional)</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="surface">
          <div className="section-head">
            <h2>Available times</h2>
            {!isWorkingDay ? <span className="pill warn">Day off</span> : null}
          </div>
          {loadingSlots ? <Spinner label="Finding slots" /> : (
            <SlotList
              slots={slots}
              timezone={timezone}
              selectedStart={selected?.start}
              onSelect={setSelected}
            />
          )}
        </section>

        <div className="confirm-bar">
          <div>
            {selected ? (
              <p>
                <strong>
                  {formatLocalTime(selected.start, timezone)} · {minutesLabel(selected.durationMinutes)}
                </strong>
                <span className="muted-copy"> with {doctorName}</span>
              </p>
            ) : (
              <p className="muted-copy">Select a time to continue</p>
            )}
          </div>
          <button className="btn primary" disabled={!selected || busy} type="submit">
            {busy ? 'Booking…' : 'Confirm booking'}
          </button>
        </div>
      </form>
    </div>
  );
}
