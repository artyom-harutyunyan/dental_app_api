import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '../api/client';
import { api } from '../api/services';
import type { AppointmentType, Doctor, Slot } from '../api/types';
import { ErrorBanner, Spinner, SuccessBanner } from '../components/Feedback';
import { SlotList } from '../components/SlotList';
import { useAuth } from '../context/AuthContext';
import { todayLocal } from '../lib/time';

export function StaffBookPage() {
  const { token, clinic } = useAuth();
  const timezone = clinic?.timezone || 'Asia/Yerevan';
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [type, setType] = useState<AppointmentType>('consultation');
  const [date, setDate] = useState(todayLocal());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void api.listDoctors(token).then((list) => {
      setDoctors(list);
      if (list[0]) setDoctorId(list[0].id);
    });
  }, [token]);

  useEffect(() => {
    if (!token || !doctorId) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSelected(null);
    (async () => {
      try {
        const res = await api.availability(token, doctorId, date, type);
        if (!cancelled) setSlots(res.slots);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load slots');
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, doctorId, date, type]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !selected) return;
    setBusy(true);
    setError(null);
    try {
      await api.createAppointment(token, {
        doctorId,
        type: selected.type,
        startTime: selected.start,
        notes: notes.trim() || undefined,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
      });
      setSuccess('Walk-in booking created.');
      setTimeout(() => navigate('/staff'), 800);
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
          <p className="eyebrow">Front desk</p>
          <h1>Add booking</h1>
          <p className="lede">Same slot engine as patient self-booking — with walk-in patient details.</p>
        </div>
      </header>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <form className="book-layout" onSubmit={onSubmit}>
        <section className="surface">
          <h2>When & who</h2>
          <div className="form-grid">
            <label>
              <span>Doctor</span>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Type</span>
              <select value={type} onChange={(e) => setType(e.target.value as AppointmentType)}>
                <option value="consultation">Consultation</option>
                <option value="treatment">Treatment</option>
              </select>
            </label>
            <label>
              <span>Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              <span>Patient name</span>
              <input
                required
                minLength={2}
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </label>
            <label>
              <span>Patient phone</span>
              <input
                required
                type="tel"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
              />
            </label>
            <label className="full">
              <span>Notes</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="surface">
          <h2>Open slots</h2>
          {loadingSlots ? <Spinner /> : (
            <SlotList
              slots={slots}
              timezone={timezone}
              selectedStart={selected?.start}
              onSelect={setSelected}
            />
          )}
        </section>

        <div className="confirm-bar">
          <p className="muted-copy">{selected ? 'Slot selected' : 'Pick a slot'}</p>
          <button className="btn primary" disabled={!selected || busy} type="submit">
            {busy ? 'Saving…' : 'Create booking'}
          </button>
        </div>
      </form>
    </div>
  );
}
