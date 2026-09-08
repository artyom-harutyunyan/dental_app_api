import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { ApiError } from '../api/client';
import { api } from '../api/services';
import { ErrorBanner } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const { setSession, token, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && token) {
    return <Navigate to="/app" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const auth = await api.register(form);
      await setSession(auth);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
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
        <h1>Create your account</h1>
        <p className="lede">Book consultations and treatments without calling the clinic.</p>
        <ErrorBanner message={error} />
        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            <span>Full name</span>
            <input
              required
              minLength={2}
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            <span>Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            <span>Phone</span>
            <input
              required
              type="tel"
              autoComplete="tel"
              placeholder="+374…"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <button className="btn primary wide" disabled={busy} type="submit">
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
