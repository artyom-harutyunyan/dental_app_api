import { apiRequest } from './client';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  AuthResponse,
  AvailabilityResponse,
  Clinic,
  Doctor,
  MyAppointments,
  ScheduleException,
  User,
  WorkingHoursEntry,
  WorkingHoursResponse,
} from './types';

export const api = {
  register(body: { name: string; email: string; phone: string; password: string }) {
    return apiRequest<AuthResponse>('POST', '/auth/register', { body });
  },
  login(body: { email: string; password: string }) {
    return apiRequest<AuthResponse>('POST', '/auth/login', { body });
  },
  me(token: string) {
    return apiRequest<User>('GET', '/auth/me', { token });
  },
  getClinic(token: string) {
    return apiRequest<Clinic>('GET', '/clinic', { token });
  },
  updateClinic(token: string, body: Partial<Clinic>) {
    return apiRequest<Clinic>('PATCH', '/clinic', { token, body });
  },
  listDoctors(token: string) {
    return apiRequest<Doctor[]>('GET', '/doctors', { token });
  },
  getWorkingHours(token: string, doctorId: string) {
    return apiRequest<WorkingHoursResponse>('GET', `/doctors/${doctorId}/working-hours`, { token });
  },
  updateWorkingHours(token: string, doctorId: string, weekly: WorkingHoursEntry[]) {
    return apiRequest<WorkingHoursResponse>('PUT', `/doctors/${doctorId}/working-hours`, {
      token,
      body: { weekly },
    });
  },
  listExceptions(token: string, doctorId: string, from?: string, to?: string) {
    return apiRequest<ScheduleException[]>('GET', `/doctors/${doctorId}/schedule-exceptions`, {
      token,
      query: { from, to },
    });
  },
  upsertException(
    token: string,
    doctorId: string,
    body: {
      date: string;
      isDayOff: boolean;
      startMinute?: number | null;
      endMinute?: number | null;
      reason?: string | null;
    },
  ) {
    return apiRequest<ScheduleException>('POST', `/doctors/${doctorId}/schedule-exceptions`, {
      token,
      body,
    });
  },
  deleteException(token: string, doctorId: string, exceptionId: string) {
    return apiRequest<null>('DELETE', `/doctors/${doctorId}/schedule-exceptions/${exceptionId}`, {
      token,
    });
  },
  availability(token: string, doctorId: string, date: string, type: AppointmentType) {
    return apiRequest<AvailabilityResponse>('GET', `/doctors/${doctorId}/availability`, {
      token,
      query: { date, type },
    });
  },
  createAppointment(
    token: string,
    body: {
      doctorId: string;
      type: AppointmentType;
      startTime: string;
      notes?: string;
      patientId?: string;
      patientName?: string;
      patientPhone?: string;
    },
  ) {
    return apiRequest<Appointment>('POST', '/appointments', { token, body });
  },
  dayQueue(token: string, doctorId: string, date: string, status?: AppointmentStatus) {
    return apiRequest<Appointment[]>('GET', '/appointments', {
      token,
      query: { doctorId, date, status },
    });
  },
  mine(token: string) {
    return apiRequest<MyAppointments>('GET', '/appointments/mine', { token });
  },
  getAppointment(token: string, id: string) {
    return apiRequest<Appointment>('GET', `/appointments/${id}`, { token });
  },
  cancelAppointment(token: string, id: string) {
    return apiRequest<Appointment | null>('DELETE', `/appointments/${id}`, { token });
  },
};
