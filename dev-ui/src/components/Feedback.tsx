import type { ReactNode } from 'react';

import type { AppointmentType } from '../api/types';

export function TypeBadge({ type }: { type: AppointmentType }) {
  return (
    <span className={`type-badge type-${type}`}>
      {type === 'consultation' ? 'Consultation' : 'Treatment'}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" aria-hidden />
      <span>{label}…</span>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="success-banner" role="status">
      {message}
    </div>
  );
}
