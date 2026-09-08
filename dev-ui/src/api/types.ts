export type UserRole = 'patient' | 'doctor' | 'nurse';
export type AppointmentType = 'consultation' | 'treatment';
export type AppointmentStatus = 'booked' | 'cancelled' | 'completed' | 'no_show';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  clinicId: string | null;
  active: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Clinic {
  id: string;
  name: string;
  timezone: string;
  consultationDurationMinutes: number;
  treatmentDurationMinutes: number;
  minTreatmentDurationMinutes: number;
  bufferMinutes: number;
}

export interface Doctor {
  id: string;
  name: string;
}

export interface WorkingHoursEntry {
  weekday: number;
  isDayOff: boolean;
  startMinute: number | null;
  endMinute: number | null;
  startLabel?: string | null;
  endLabel?: string | null;
}

export interface WorkingHoursResponse {
  doctorId: string;
  timezone: string;
  weekly: WorkingHoursEntry[];
}

export interface ScheduleException {
  id: string;
  doctorId: string;
  date: string;
  isDayOff: boolean;
  startMinute: number | null;
  endMinute: number | null;
  reason: string | null;
}

export interface Slot {
  start: string;
  end: string;
  durationMinutes: number;
  type: AppointmentType;
}

export interface AvailabilityResponse {
  doctorId: string;
  date: string;
  timezone: string;
  type: AppointmentType;
  isWorkingDay: boolean;
  slots: Slot[];
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctor: { id: string; name: string };
  patientId: string;
  patient?: { id: string; name: string; phone: string | null };
  type: AppointmentType;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: AppointmentStatus;
  createdBy: 'patient' | 'staff';
  notes: string | null;
}

export interface MyAppointments {
  upcoming: Appointment[];
  past: Appointment[];
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  path?: string;
  timestamp?: string;
  details?: string[];
}

export interface RequestResult<T = unknown> {
  ok: boolean;
  status: number;
  durationMs: number;
  method: string;
  path: string;
  data: T | ApiErrorBody | null;
  rawText: string;
}
