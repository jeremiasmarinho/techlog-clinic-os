import { db } from './index';

export interface MedicalRecordRow {
    id: number;
    clinic_id: number;
    patient_id: number;
    anamnesis_text: string | null;
    diagnosis: string | null;
    doctor_id: number | null;
    created_at: string;
    deleted_at: string | null;
}

export class MedicalRecordsRepository {
    static listByPatientId(patientId: number, clinicId: number): Promise<MedicalRecordRow[]> {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM medical_records
                 WHERE patient_id = ? AND clinic_id = ? AND deleted_at IS NULL
                 ORDER BY created_at ASC`,
                [patientId, clinicId],
                (err, rows: MedicalRecordRow[]) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    static create(
        record: Omit<MedicalRecordRow, 'id' | 'created_at' | 'deleted_at'>
    ): Promise<number> {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO medical_records (clinic_id, patient_id, anamnesis_text, diagnosis, doctor_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    record.clinic_id,
                    record.patient_id,
                    record.anamnesis_text,
                    record.diagnosis,
                    record.doctor_id,
                ],
                function (err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }

    static softDelete(id: number, clinicId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE medical_records SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ?`,
                [id, clinicId],
                function (err) {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }
}
