import { AppointmentType } from '../../../common/enums/appointment-type.enum';
import { ClinicSchedulingSettings } from '../../clinics/interfaces/clinic-scheduling-settings.interface';
import { Interval } from './interval.interface';

export interface Slot {
  start: Date;
  end: Date;
  durationMinutes: number;
  type: AppointmentType;
}

export interface BusyInterval extends Interval {
  type: AppointmentType;
}

export interface SlotInput {
  window: Interval | null;
  busy: BusyInterval[];
  settings: ClinicSchedulingSettings;
  type: AppointmentType;
}
