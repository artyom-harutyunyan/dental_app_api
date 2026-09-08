import { FormEvent, useEffect, useState } from 'react';

import { ApiError } from '../api/client';
import { api } from '../api/services';
import type { Doctor, ScheduleException, WorkingHoursEntry } from '../api/types';
import { ErrorBanner, Spinner, SuccessBanner } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { WEEKDAY_LABELS, todayLocal } from '../lib/time';

export function WorkingHoursPage() {
  const { token } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [weekly, setWeekly] = useState<WorkingHoursEntry[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exceptionForm, setExceptionForm] = useState({
    date: todayLocal(),
    isDayOff: true,
    startMinute: 540,
    endMinute: 780,
    reason: '',
  });

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
    setLoading(true);
    (async () => {
      try {
        const [hours, ex] = await Promise.all([
          api.getWorkingHours(token, doctorId),
          api.listExceptions(token, doctorId),
        ]);
        if (cancelled) return;
        setWeekly(
          hours.weekly.map((e) => ({
            weekday: e.weekday,
            isDayOff: e.isDayOff,
            startMinute: e.startMinute,
            endMinute: e.endMinute,
          })),
        );
        setExceptions(ex);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load hours');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, doctorId]);

  function updateDay(index: number, patch: Partial<WorkingHoursEntry>) {
    setWeekly((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function saveHours(e: FormEvent) {
    e.preventDefault();
    if (!token || !doctorId) return;
    setBusy(true);
    setError(null);
    try {
      await api.updateWorkingHours(
        token,
        doctorId,
        weekly.map((row) => ({
          weekday: row.weekday,
          isDayOff: row.isDayOff,
          startMinute: row.isDayOff ? null : row.startMinute,
          endMinute: row.isDayOff ? null : row.endMinute,
        })),
      );
      setSuccess('Weekly hours saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function addException(e: FormEvent) {
    e.preventDefault();
    if (!token || !doctorId) return;
    setBusy(true);
    setError(null);
    try {
      await api.upsertException(token, doctorId, {
        date: exceptionForm.date,
        isDayOff: exceptionForm.isDayOff,
        startMinute: exceptionForm.isDayOff ? null : exceptionForm.startMinute,
        endMinute: exceptionForm.isDayOff ? null : exceptionForm.endMinute,
        reason: exceptionForm.reason || null,
      });
      const ex = await api.listExceptions(token, doctorId);
      setExceptions(ex);
      setSuccess('Exception saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save exception');
    } finally {
      setBusy(false);
    }
  }

  async function removeException(id: string) {
    if (!token || !doctorId) return;
    setBusy(true);
    try {
      await api.deleteException(token, doctorId, id);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
      setSuccess('Exception removed.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <div>
          <p className="eyebrow">Schedule</p>
          <h1>Working hours</h1>
          <p className="lede">Minutes from local midnight — 540 is 09:00, 1080 is 18:00.</p>
        </div>
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
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {loading ? <Spinner /> : null}

      {!loading ? (
        <>
          <form className="surface" onSubmit={saveHours}>
            <h2>Weekly template</h2>
            <div className="hours-table">
              <div className="hours-row head">
                <span>Day</span>
                <span>Off</span>
                <span>Start</span>
                <span>End</span>
              </div>
              {weekly.map((row, index) => (
                <div className="hours-row" key={row.weekday}>
                  <span>{WEEKDAY_LABELS[row.weekday]}</span>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={row.isDayOff}
                      onChange={(e) =>
                        updateDay(index, {
                          isDayOff: e.target.checked,
                          startMinute: e.target.checked ? null : 540,
                          endMinute: e.target.checked ? null : 1080,
                        })
                      }
                    />
                  </label>
                  <input
                    type="number"
                    disabled={row.isDayOff}
                    value={row.startMinute ?? ''}
                    onChange={(e) => updateDay(index, { startMinute: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    disabled={row.isDayOff}
                    value={row.endMinute ?? ''}
                    onChange={(e) => updateDay(index, { endMinute: Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>
            <button className="btn primary" disabled={busy} type="submit">
              Save weekly hours
            </button>
          </form>

          <section className="surface">
            <h2>Date exceptions</h2>
            <form className="form-grid" onSubmit={addException}>
              <label>
                <span>Date</span>
                <input
                  type="date"
                  required
                  value={exceptionForm.date}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, date: e.target.value })}
                />
              </label>
              <label className="check-label">
                <span>Day off</span>
                <input
                  type="checkbox"
                  checked={exceptionForm.isDayOff}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, isDayOff: e.target.checked })}
                />
              </label>
              <label>
                <span>Start minute</span>
                <input
                  type="number"
                  disabled={exceptionForm.isDayOff}
                  value={exceptionForm.startMinute}
                  onChange={(e) =>
                    setExceptionForm({ ...exceptionForm, startMinute: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                <span>End minute</span>
                <input
                  type="number"
                  disabled={exceptionForm.isDayOff}
                  value={exceptionForm.endMinute}
                  onChange={(e) =>
                    setExceptionForm({ ...exceptionForm, endMinute: Number(e.target.value) })
                  }
                />
              </label>
              <label className="full">
                <span>Reason</span>
                <input
                  value={exceptionForm.reason}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, reason: e.target.value })}
                />
              </label>
              <div className="full">
                <button className="btn secondary" disabled={busy} type="submit">
                  Save exception
                </button>
              </div>
            </form>

            <ul className="exception-list">
              {exceptions.map((ex) => (
                <li key={ex.id}>
                  <div>
                    <strong>{ex.date}</strong>
                    <span className="muted-copy">
                      {ex.isDayOff
                        ? 'Day off'
                        : `${ex.startMinute}–${ex.endMinute}`}
                      {ex.reason ? ` · ${ex.reason}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn ghost"
                    disabled={busy}
                    onClick={() => void removeException(ex.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
