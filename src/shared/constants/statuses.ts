export const PATIENT_STATUSES = {
    WAITING: 'waiting',
    TRIAGE: 'triage',
    CONSULTATION: 'consultation',
    FINISHED: 'finished',
} as const;

export const PATIENT_STATUS_VALUES = Object.values(PATIENT_STATUSES);

export type PatientStatus = (typeof PATIENT_STATUSES)[keyof typeof PATIENT_STATUSES];
