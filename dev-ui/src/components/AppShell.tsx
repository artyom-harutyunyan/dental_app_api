import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export function AppShell() {
  const { user, clinic, clearSession, isStaff } = useAuth();

  return (
    <div className="shell">
      <header className="top-nav">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <p className="brand-name">{clinic?.name || 'Yerevan Dental'}</p>
            <p className="brand-sub">Clinic planner</p>
          </div>
        </div>

        <nav className="nav-links" aria-label="Main">
          {isStaff ? (
            <>
              <NavLink to="/staff">Day queue</NavLink>
              <NavLink to="/staff/book">Add booking</NavLink>
              <NavLink to="/staff/hours">Hours</NavLink>
              <NavLink to="/staff/clinic">Clinic</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/app">Doctors</NavLink>
              <NavLink to="/app/book">Book</NavLink>
              <NavLink to="/app/appointments">My visits</NavLink>
            </>
          )}
        </nav>

        <div className="nav-user">
          <div className="nav-user-text">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
          <button type="button" className="btn ghost" onClick={clearSession}>
            Sign out
          </button>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
