import { Navigate, Outlet } from 'react-router-dom';

import { Spinner } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ staff }: { staff?: boolean }) {
  const { token, loading, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="center-screen">
        <Spinner label="Loading session" />
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  if (staff && !isStaff) return <Navigate to="/app" replace />;
  if (!staff && isStaff) return <Navigate to="/staff" replace />;

  return <Outlet />;
}
