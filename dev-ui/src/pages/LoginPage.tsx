import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { ApiError } from '../api/client';
import { api } from '../api/services';
import { ErrorBanner } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { setSession, token, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('patient@example.test');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && token) {
    return <Navigate to={isStaff ? '/staff' : '/app'} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const auth = await api.login({ email, password });
      await setSession(auth);
      navigate(auth.user.role === 'patient' ? '/app' : '/staff', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-hero" aria-hidden>
        <div className="auth-hero-glow" />
      </div>
      <div className="auth-card">
        <p className="eyebrow">Yerevan Dental</p>
        <h1>Welcome back</h1>
        <p className="lede">Sign in to book a visit or manage today’s queue.</p>

        <ErrorBanner message={error} />

        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="btn primary wide" disabled={busy} type="submit">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          New patient? <Link to="/register">Create an account</Link>
        </p>

        <div className="seed-hints">
          <p className="muted-copy">Seeded demos</p>
          <div className="chip-row">
            {[
              ['Patient', 'patient@example.test'],
              ['Nurse', 'nurse@clinic.test'],
              ['Doctor', 'doctor.one@clinic.test'],
            ].map(([label, value]) => (
              <button
                key={value}
                type="button"
                className="chip"
                onClick={() => {
                  setEmail(value);
                  setPassword('password123');
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
