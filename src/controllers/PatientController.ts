import { Request, Response } from 'express';
import { db } from '../database';
import { PATIENT_STATUS_VALUES, PATIENT_STATUSES } from '../shared/constants/statuses';
import { MedicalRecordsRepository } from '../database/medicalRecords.repository';
import { PrescriptionsRepository } from '../database/prescriptions.repository';

export class PatientController {
    /**
     * PATCH /api/patients/:id/status
     */
    static updateStatus(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const { id } = req.params;
        const { status } = req.body || {};

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        if (!PATIENT_STATUS_VALUES.includes(status)) {
            res.status(400).json({ error: 'Status inválido' });
            return;
        }

        db.run(
            'UPDATE patients SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ?',
            [status, id, clinicId],
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (this.changes === 0) {
                    res.status(404).json({ error: 'Paciente não encontrado' });
                    return;
                }

                res.json({ success: true, id, status });
            }
        );
    }

    /**
     * GET /api/patients/:id/history
     */
    static getHistory(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const { id } = req.params;
        const patientId = Number(id);

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        if (!Number.isFinite(patientId)) {
            res.status(400).json({ error: 'ID de paciente inválido' });
            return;
        }

        db.get(
            'SELECT id FROM patients WHERE id = ? AND clinic_id = ?',
            [patientId, clinicId],
            async (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (!row) {
                    res.status(404).json({ error: 'Paciente não encontrado' });
                    return;
                }

                try {
                    const [records, prescriptions] = await Promise.all([
                        MedicalRecordsRepository.listByPatientId(patientId, clinicId),
                        PrescriptionsRepository.listByPatientId(patientId, clinicId),
                    ]);

                    const history = [
                        ...records.map((item) => ({
                            type: 'medical_record',
                            ...item,
                        })),
                        ...prescriptions.map((item) => ({
                            type: 'prescription',
                            ...item,
                        })),
                    ].sort(
                        (a, b) =>
                            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );

                    res.json({
                        success: true,
                        patient_id: patientId,
                        history,
                    });
                } catch (error: any) {
                    res.status(500).json({ error: error.message });
                }
            }
        );
    }

    /**
     * POST /api/patients/:id/finish
     */
    static finishAppointment(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const user = req.user;
        const { id } = req.params;
        const patientId = Number(id);
        const { anamnesisText, diagnosis, medications } = req.body || {};

        if (!clinicId || !user) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        if (!Number.isFinite(patientId)) {
            res.status(400).json({ error: 'ID de paciente inválido' });
            return;
        }

        const medsJson = JSON.stringify(Array.isArray(medications) ? medications : []);

        const rollback = (err: Error) => {
            db.run('ROLLBACK', () => {
                res.status(500).json({ error: err.message || 'Erro ao finalizar atendimento' });
            });
        };

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            db.run(
                `INSERT INTO medical_records (clinic_id, patient_id, anamnesis_text, diagnosis, doctor_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [clinicId, patientId, anamnesisText || null, diagnosis || null, user.userId],
                function (medErr) {
                    if (medErr) return rollback(medErr);

                    const medicalRecordId = this.lastID;

                    db.run(
                        `INSERT INTO prescriptions (clinic_id, patient_id, medications_json, pdf_url, doctor_id)
                         VALUES (?, ?, ?, ?, ?)`,
                        [clinicId, patientId, medsJson, null, user.userId],
                        function (prescErr) {
                            if (prescErr) return rollback(prescErr);

                            const prescriptionId = this.lastID;

                            db.run(
                                `UPDATE patients
                                 SET status = ?, end_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                                 WHERE id = ? AND clinic_id = ?`,
                                [PATIENT_STATUSES.FINISHED, patientId, clinicId],
                                function (updateErr) {
                                    if (updateErr) return rollback(updateErr);

                                    if (this.changes === 0) {
                                        return rollback(new Error('Paciente não encontrado'));
                                    }

                                    db.run('COMMIT', (commitErr) => {
                                        if (commitErr) return rollback(commitErr);

                                        res.json({
                                            success: true,
                                            medical_record_id: medicalRecordId,
                                            prescription_id: prescriptionId,
                                            patient_id: patientId,
                                            status: PATIENT_STATUSES.FINISHED,
                                        });
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    }
}
