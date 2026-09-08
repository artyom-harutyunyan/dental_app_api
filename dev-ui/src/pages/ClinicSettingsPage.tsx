import { FormEvent, useEffect, useState } from 'react';

import { ApiError } from '../api/client';
import { api } from '../api/services';
import { ErrorBanner, Spinner, SuccessBanner } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';

export function ClinicSettingsPage() {
  const { token, clinic, refreshClinic } = useAuth();
  const [form, setForm] = useState({
    name: '',
    timezone: 'Asia/Yerevan',
    consultationDurationMinutes: 15,
    treatmentDurationMinutes: 90,
    minTreatmentDurationMinutes: 60,
    bufferMinutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!clinic) return;
    setForm({
      name: clinic.name,
      timezone: clinic.timezone,
      consultationDurationMinutes: clinic.consultationDurationMinutes,
      treatmentDurationMinutes: clinic.treatmentDurationMinutes,
      minTreatmentDurationMinutes: clinic.minTreatmentDurationMinutes,
      bufferMinutes: clinic.bufferMinutes,
    });
    setLoading(false);
  }, [clinic]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await api.updateClinic(token, form);
      await refreshClinic();
      setSuccess('Clinic settings updated.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Clinic</h1>
          <p className="lede">Durations feed the slot engine for every doctor.</p>
        </div>
      </header>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <form className="surface stack-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            <span>Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            <span>Timezone</span>
            <input
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              required
            />
          </label>
          <label>
            <span>Consultation (min)</span>
            <input
              type="number"
              min={1}
              value={form.consultationDurationMinutes}
              onChange={(e) =>
                setForm({ ...form, consultationDurationMinutes: Number(e.target.value) })
              }
            />
          </label>
          <label>
            <span>Treatment (min)</span>
            <input
              type="number"
              min={1}
              value={form.treatmentDurationMinutes}
              onChange={(e) =>
                setForm({ ...form, treatmentDurationMinutes: Number(e.target.value) })
              }
            />
          </label>
          <label>
            <span>Min treatment (min)</span>
            <input
              type="number"
              min={1}
              value={form.minTreatmentDurationMinutes}
              onChange={(e) =>
                setForm({ ...form, minTreatmentDurationMinutes: Number(e.target.value) })
              }
            />
          </label>
          <label>
            <span>Buffer (min)</span>
            <input
              type="number"
              min={0}
              value={form.bufferMinutes}
              onChange={(e) => setForm({ ...form, bufferMinutes: Number(e.target.value) })}
            />
          </label>
        </div>
        <button className="btn primary" disabled={busy} type="submit">
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
