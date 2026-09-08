export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
}

export const STAFF_ROLES: readonly UserRole[] = [UserRole.DOCTOR, UserRole.NURSE];

export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}
