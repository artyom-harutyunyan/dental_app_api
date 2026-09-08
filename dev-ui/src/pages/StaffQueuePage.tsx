import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ApiError } from '../api/client';
import { api } from '../api/services';
import type { Appointment, Doctor } from '../api/types';
import { EmptyState, ErrorBanner, Spinner, SuccessBanner, TypeBadge } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { formatLocalTime, minutesLabel, todayLocal } from '../lib/time';

export function StaffQueuePage() {
  const { token, user, clinic } = useAuth();
  const timezone = clinic?.timezone || 'Asia/Yerevan';
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(todayLocal());
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void api.listDoctors(token).then((list) => {
      setDoctors(list);
      if (user?.role === 'doctor') {
        const mine = list.find((d) => d.id === user.id) || list[0];
        if (mine) setDoctorId(mine.id);
      } else if (list[0]) {
        setDoctorId(list[0].id);
      }
    });
  }, [token, user]);

  const load = useCallback(async () => {
    if (!token || !doctorId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await api.dayQueue(token, doctorId, date);
      setQueue(rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [token, doctorId, date]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(id: string) {
    if (!token) return;
    if (!window.confirm('Cancel this booking?')) return;
    setBusyId(id);
    try {
      await api.cancelAppointment(token, id);
      setSuccess('Booking cancelled — slot is free again.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cancel failed');
    } finally {
      setBusyId(null);
    }
  }

  const booked = queue.filter((a) => a.status === 'booked');

  return (
    <div className="page-stack">
      <header className="page-hero">
        <div>
          <p className="eyebrow">Staff desk</p>
          <h1>Day queue</h1>
          <p className="lede">Chronological bookings for the selected doctor and date.</p>
        </div>
        <Link className="btn primary" to="/staff/book">
          Add booking
        </Link>
      </header>

      <div className="toolbar surface">
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
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button type="button" className="btn secondary" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {loading ? <Spinner label="Loading queue" /> : null}

      {!loading && booked.length === 0 ? (
        <EmptyState
          title="No bookings today"
          body="The day is clear. Add a walk-in or wait for patient self-booking."
          action={
            <Link className="btn primary" to="/staff/book">
              Add booking
            </Link>
          }
        />
      ) : null}

      <ul className="queue-list">
        {queue.map((a) => (
          <li key={a.id} className={`queue-item status-${a.status}`}>
            <div className="queue-time">
              <strong>{formatLocalTime(a.startTime, timezone)}</strong>
              <span>{minutesLabel(a.durationMinutes)}</span>
            </div>
            <div className="queue-body">
              <div className="appt-top">
                <TypeBadge type={a.type} />
                <span className="pill">{a.status}</span>
              </div>
              <strong>{a.patient?.name || 'Patient'}</strong>
              <p className="muted-copy">
                {a.patient?.phone || 'No phone'} · {a.createdBy === 'staff' ? 'Walk-in' : 'Self-book'}
              </p>
            </div>
            {a.status === 'booked' ? (
              <button
                type="button"
                className="btn danger"
                disabled={busyId === a.id}
                onClick={() => void cancel(a.id)}
              >
                Cancel
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
