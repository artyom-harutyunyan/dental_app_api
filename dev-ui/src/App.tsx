import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { RequireAuth } from './components/RequireAuth';
import { BookPage } from './pages/BookPage';
import { ClinicSettingsPage } from './pages/ClinicSettingsPage';
import { LoginPage } from './pages/LoginPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { PatientHomePage } from './pages/PatientHomePage';
import { RegisterPage } from './pages/RegisterPage';
import { StaffBookPage } from './pages/StaffBookPage';
import { StaffQueuePage } from './pages/StaffQueuePage';
import { WorkingHoursPage } from './pages/WorkingHoursPage';

export default function App() {
  return (
    <BrowserRouter basename="/dev-ui">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/app" element={<PatientHomePage />} />
            <Route path="/app/book" element={<BookPage />} />
            <Route path="/app/appointments" element={<MyAppointmentsPage />} />
          </Route>
        </Route>

        <Route element={<RequireAuth staff />}>
          <Route element={<AppShell />}>
            <Route path="/staff" element={<StaffQueuePage />} />
            <Route path="/staff/book" element={<StaffBookPage />} />
            <Route path="/staff/hours" element={<WorkingHoursPage />} />
            <Route path="/staff/clinic" element={<ClinicSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
