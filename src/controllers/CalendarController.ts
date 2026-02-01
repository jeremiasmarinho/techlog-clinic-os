import { Request, Response } from 'express';
import { db } from '../database';

export class CalendarController {
    /**
     * GET /api/calendar/appointments?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     */
    static listAppointments(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        const startExpr = 'COALESCE(a.start_time, a.appointment_date)';
        const endExpr =
            "COALESCE(a.end_time, datetime(a.appointment_date, '+' || COALESCE(a.duration_minutes, 30) || ' minutes'))";
        const conditions: string[] = ['a.clinic_id = ?'];
        const params: Array<string | number> = [clinicId];

        if (startDate) {
            conditions.push(`${startExpr} >= ?`);
            params.push(startDate);
        }

        if (endDate) {
            conditions.push(`${endExpr} <= ?`);
            params.push(endDate);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        db.all(
            `SELECT
                a.id,
                a.clinic_id,
                a.doctor_id,
                a.patient_id,
                COALESCE(a.start_time, a.appointment_date) as start_time,
                COALESCE(a.end_time, datetime(a.appointment_date, '+' || COALESCE(a.duration_minutes, 30) || ' minutes')) as end_time,
                a.status,
                a.notes,
                p.name as patient_name,
                p.phone as patient_phone
             FROM appointments a
             LEFT JOIN patients p ON p.id = a.patient_id
             ${whereClause}
             ORDER BY COALESCE(a.start_time, a.appointment_date) ASC`,
            params,
            (err, rows) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                res.json(rows || []);
            }
        );
    }

    /**
     * PATCH /api/appointments/:id
     */
    static updateAppointment(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const { id } = req.params;
        const { start, end } = req.body || {};

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        if (!start || !end) {
            res.status(400).json({ error: 'start e end são obrigatórios' });
            return;
        }

        db.run(
            `UPDATE appointments
             SET start_time = ?, end_time = ?, appointment_date = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND clinic_id = ?`,
            [start, end, start, id, clinicId],
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (this.changes === 0) {
                    res.status(404).json({ error: 'Agendamento não encontrado' });
                    return;
                }

                res.json({ success: true, id, start, end });
            }
        );
    }
}
