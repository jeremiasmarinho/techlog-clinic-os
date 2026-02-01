import { db } from './index';

export interface PrescriptionRow {
    id: number;
    clinic_id: number;
    patient_id: number;
    medications_json: string | null;
    pdf_url: string | null;
    doctor_id: number | null;
    created_at: string;
    deleted_at: string | null;
}

export class PrescriptionsRepository {
    static listByPatientId(patientId: number, clinicId: number): Promise<PrescriptionRow[]> {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM prescriptions
                 WHERE patient_id = ? AND clinic_id = ? AND deleted_at IS NULL
                 ORDER BY created_at ASC`,
                [patientId, clinicId],
                (err, rows: PrescriptionRow[]) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    static create(
        record: Omit<PrescriptionRow, 'id' | 'created_at' | 'deleted_at'>
    ): Promise<number> {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO prescriptions (clinic_id, patient_id, medications_json, pdf_url, doctor_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    record.clinic_id,
                    record.patient_id,
                    record.medications_json,
                    record.pdf_url,
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
                `UPDATE prescriptions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ?`,
                [id, clinicId],
                function (err) {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }
}
