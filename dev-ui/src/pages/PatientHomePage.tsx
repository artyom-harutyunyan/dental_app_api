import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ApiError } from '../api/client';
import { api } from '../api/services';
import type { Doctor } from '../api/types';
import { EmptyState, ErrorBanner, Spinner } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';

export function PatientHomePage() {
  const { token, clinic } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await api.listDoctors(token);
        if (!cancelled) setDoctors(list);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load doctors');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="page-stack">
      <header className="page-hero">
        <div>
          <p className="eyebrow">Book a visit</p>
          <h1>Choose your doctor</h1>
          <p className="lede">
            Times are shown in {clinic?.timezone || 'clinic local time'}. Pick a doctor to see open
            slots.
          </p>
        </div>
        <Link className="btn primary" to="/app/book">
          Start booking
        </Link>
      </header>

      <ErrorBanner message={error} />
      {loading ? <Spinner label="Loading doctors" /> : null}

      {!loading && doctors.length === 0 ? (
        <EmptyState title="No doctors available" body="Please check back later or contact the clinic." />
      ) : null}

      <div className="doctor-grid">
        {doctors.map((doctor) => (
          <article key={doctor.id} className="doctor-tile">
            <div className="avatar" aria-hidden>
              {doctor.name
                .split(' ')
                .slice(0, 2)
                .map((p) => p[0])
                .join('')}
            </div>
            <div>
              <h2>{doctor.name}</h2>
              <p className="muted-copy">Consultation & treatment</p>
            </div>
            <Link className="btn primary" to={`/app/book?doctorId=${doctor.id}`}>
              Book
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
