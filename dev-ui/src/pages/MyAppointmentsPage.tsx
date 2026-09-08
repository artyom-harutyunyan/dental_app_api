import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ApiError } from '../api/client';
import { api } from '../api/services';
import type { Appointment } from '../api/types';
import { EmptyState, ErrorBanner, Spinner, SuccessBanner, TypeBadge } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { formatLocalDate, formatLocalTime, minutesLabel } from '../lib/time';

export function MyAppointmentsPage() {
  const { token, clinic } = useAuth();
  const timezone = clinic?.timezone || 'Asia/Yerevan';
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.mine(token);
      setUpcoming(data.upcoming || []);
      setPast(data.past || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(id: string) {
    if (!token) return;
    if (!window.confirm('Cancel this appointment? The slot will open again.')) return;
    setBusyId(id);
    setError(null);
    try {
      await api.cancelAppointment(token, id);
      setSuccess('Appointment cancelled.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cancel failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <div>
          <p className="eyebrow">Your schedule</p>
          <h1>My visits</h1>
        </div>
        <Link className="btn primary" to="/app/book">
          Book again
        </Link>
      </header>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {loading ? <Spinner /> : null}

      {!loading && upcoming.length === 0 ? (
        <EmptyState
          title="No upcoming visits"
          body="When you book a consultation or treatment, it will show up here."
          action={
            <Link className="btn primary" to="/app/book">
              Book a visit
            </Link>
          }
        />
      ) : null}

      {upcoming.length > 0 ? (
        <section className="surface">
          <h2>Upcoming</h2>
          <ul className="appt-list">
            {upcoming.map((a) => (
              <li key={a.id} className="appt-row">
                <div>
                  <div className="appt-top">
                    <TypeBadge type={a.type} />
                    <span className="duration-pill">{minutesLabel(a.durationMinutes)}</span>
                  </div>
                  <strong>
                    {formatLocalDate(a.startTime, timezone)} · {formatLocalTime(a.startTime, timezone)}
                  </strong>
                  <p className="muted-copy">{a.doctor.name}</p>
                </div>
                {a.status === 'booked' ? (
                  <button
                    type="button"
                    className="btn danger"
                    disabled={busyId === a.id}
                    onClick={() => void cancel(a.id)}
                  >
                    {busyId === a.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                ) : (
                  <span className="pill">{a.status}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="surface">
          <h2>Past</h2>
          <ul className="appt-list">
            {past.map((a) => (
              <li key={a.id} className="appt-row muted-row">
                <div>
                  <div className="appt-top">
                    <TypeBadge type={a.type} />
                    <span className="pill">{a.status}</span>
                  </div>
                  <strong>
                    {formatLocalDate(a.startTime, timezone)} · {formatLocalTime(a.startTime, timezone)}
                  </strong>
                  <p className="muted-copy">{a.doctor.name}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
