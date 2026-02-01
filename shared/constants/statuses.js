const PATIENT_STATUSES = {
    WAITING: 'waiting',
    TRIAGE: 'triage',
    CONSULTATION: 'consultation',
    FINISHED: 'finished',
};

const PATIENT_STATUS_VALUES = Object.values(PATIENT_STATUSES);

if (typeof window !== 'undefined') {
    window.PATIENT_STATUSES = PATIENT_STATUSES;
    window.PATIENT_STATUS_VALUES = PATIENT_STATUS_VALUES;
}

module.exports = {
    PATIENT_STATUSES,
    PATIENT_STATUS_VALUES,
};
