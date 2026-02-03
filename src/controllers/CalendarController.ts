import { Request, Response } from 'express';
import { db } from '../database';
import { LeadRepository } from '../repositories/lead.repository';

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

        // Exclude cancelled and archived appointments from listing
        conditions.push("a.status NOT IN ('cancelled', 'archived')");

        if (startDate) {
            conditions.push(`${startExpr} >= ?`);
            params.push(startDate);
        }

        if (endDate) {
            conditions.push(`${endExpr} <= ?`);
            params.push(endDate);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const leadConditions: string[] = ['l.appointment_date IS NOT NULL'];
        const leadParams: Array<string | number> = [];

        // Exclude cancelled and archived leads from listing
        leadConditions.push("l.status NOT IN ('cancelled', 'archived')");

        if (clinicId) {
            leadConditions.push('l.clinic_id = ?');
            leadParams.push(clinicId);
        }

        if (startDate) {
            leadConditions.push('datetime(l.appointment_date) >= datetime(?)');
            leadParams.push(startDate);
        }

        if (endDate) {
            leadConditions.push('datetime(l.appointment_date) <= datetime(?)');
            leadParams.push(endDate);
        }

        const leadWhereClause = leadConditions.length
            ? `WHERE ${leadConditions.join(' AND ')}`
            : '';

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
                a.type,
                a.doctor,
                a.insurance,
                COALESCE(a.patient_name, p.name) as patient_name,
                COALESCE(a.patient_phone, p.phone) as patient_phone
             FROM appointments a
             LEFT JOIN patients p ON p.id = a.patient_id
             ${whereClause}
             ORDER BY COALESCE(a.start_time, a.appointment_date) ASC`,
            params,
            (appointmentsErr, appointmentRows) => {
                if (appointmentsErr) {
                    console.warn('⚠️ Erro ao buscar appointments:', appointmentsErr.message);
                }

                db.all(
                    `SELECT
                        'lead' as source,
                        l.id as raw_id,
                        ('lead-' || l.id) as id,
                        l.clinic_id,
                        NULL as doctor_id,
                        NULL as patient_id,
                        l.appointment_date as start_time,
                        datetime(l.appointment_date, '+30 minutes') as end_time,
                        l.status,
                        l.notes,
                        l.name as patient_name,
                        l.phone as patient_phone
                     FROM leads l
                     ${leadWhereClause}
                     ORDER BY datetime(l.appointment_date) ASC`,
                    leadParams,
                    (leadErr, leadRows) => {
                        if (leadErr && appointmentsErr) {
                            res.status(500).json({ error: leadErr.message });
                            return;
                        }

                        const rows = [...(appointmentRows || []), ...(leadRows || [])];
                        res.json(rows);
                    }
                );
            }
        );
    }

    /**
     * GET /api/appointments/:id
     * Get a single appointment by ID with patient data
     * Supports both regular appointments and leads (lead-123 format)
     */
    static getAppointment(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const { id } = req.params;

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        // Check if it's a lead (id starts with 'lead-')
        if (id.startsWith('lead-')) {
            const leadId = id.replace('lead-', '');
            db.get(
                `SELECT 
                    l.id,
                    ('lead-' || l.id) as composite_id,
                    l.clinic_id,
                    l.name as patient_name,
                    l.phone as patient_phone,
                    l.appointment_date,
                    l.appointment_date as start_time,
                    datetime(l.appointment_date, '+30 minutes') as end_time,
                    l.status,
                    l.notes,
                    'lead' as source
                 FROM leads l
                 WHERE l.id = ? AND l.clinic_id = ?`,
                [leadId, clinicId],
                (err, row) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    if (!row) {
                        res.status(404).json({ error: 'Lead não encontrado' });
                        return;
                    }
                    res.json(row);
                }
            );
            return;
        }

        // Regular appointment - JOIN with patients table
        db.get(
            `SELECT 
                a.*,
                COALESCE(a.patient_name, p.name) as patient_name,
                COALESCE(a.patient_phone, p.phone) as patient_phone
             FROM appointments a
             LEFT JOIN patients p ON a.patient_id = p.id
             WHERE a.id = ? AND a.clinic_id = ?`,
            [id, clinicId],
            (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (!row) {
                    res.status(404).json({ error: 'Agendamento não encontrado' });
                    return;
                }

                res.json(row);
            }
        );
    }

    /**
     * PATCH /api/appointments/:id
     * Supports partial updates: start/end for drag-drop, status for archive, etc.
     */
    static async updateAppointment(req: Request, res: Response): Promise<void> {
        const clinicId = req.clinicId;
        const { id } = req.params;
        const {
            start,
            end,
            status,
            notes,
            patient_name,
            patient_phone,
            insurance,
            name,
            phone,
            appointment_date,
            doctor,
            type, // Also accept frontend field names
        } = req.body || {};

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        // At least one field must be provided
        if (
            !start &&
            !end &&
            !status &&
            !notes &&
            !patient_name &&
            !patient_phone &&
            !insurance &&
            !name &&
            !phone &&
            !appointment_date &&
            !doctor &&
            !type
        ) {
            res.status(400).json({
                error: 'Pelo menos um campo deve ser fornecido para atualização',
            });
            return;
        }

        const appointmentId = Array.isArray(id) ? id[0] : id;

        if (appointmentId.startsWith('lead-')) {
            const leadId = Number(appointmentId.replace('lead-', ''));

            if (!Number.isFinite(leadId) || leadId <= 0) {
                res.status(400).json({ error: 'ID de lead inválido' });
                return;
            }

            try {
                // Build update object for leads
                const leadUpdate: Record<string, any> = {};
                if (start) leadUpdate.appointment_date = start;
                if (status) leadUpdate.status = status;
                if (notes !== undefined) leadUpdate.notes = notes;
                if (doctor !== undefined) leadUpdate.doctor = doctor;

                const changes = await LeadRepository.update(leadId, leadUpdate, clinicId);

                if (changes === 0) {
                    res.status(404).json({ error: 'Agendamento não encontrado' });
                    return;
                }

                res.json({ success: true, id: appointmentId, start, end, status, source: 'lead' });
            } catch (error) {
                res.status(500).json({ error: (error as Error).message });
            }

            return;
        }

        // Build dynamic UPDATE query based on provided fields
        const updates: string[] = [];
        const params: any[] = [];

        // Handle start time (from drag-drop or form)
        const startTime = start || appointment_date;
        if (startTime) {
            updates.push('start_time = ?');
            params.push(startTime);
            updates.push('appointment_date = ?');
            params.push(startTime);
        }
        if (end) {
            updates.push('end_time = ?');
            params.push(end);
        }
        if (status) {
            updates.push('status = ?');
            params.push(status);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }
        // Handle patient name (accept both field names)
        const patientName = patient_name || name;
        if (patientName) {
            updates.push('patient_name = ?');
            params.push(patientName);
        }
        // Handle patient phone (accept both field names)
        const patientPhone = patient_phone || phone;
        if (patientPhone) {
            updates.push('patient_phone = ?');
            params.push(patientPhone);
        }
        if (insurance) {
            updates.push('insurance = ?');
            params.push(insurance);
        }
        if (doctor) {
            updates.push('doctor = ?');
            params.push(doctor);
        }
        if (type) {
            updates.push('type = ?');
            params.push(type);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(appointmentId, clinicId);

        const sql = `UPDATE appointments SET ${updates.join(', ')} WHERE id = ? AND clinic_id = ?`;

        db.run(sql, params, function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (this.changes === 0) {
                res.status(404).json({ error: 'Agendamento não encontrado' });
                return;
            }

            res.json({ success: true, id: appointmentId, message: 'Agendamento atualizado' });
        });
    }

    /**
     * DELETE /api/appointments/:id
     */
    static async deleteAppointment(req: Request, res: Response): Promise<void> {
        const clinicId = req.clinicId;
        const { id } = req.params;

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        const appointmentId = Array.isArray(id) ? id[0] : id;

        if (appointmentId.startsWith('lead-')) {
            const leadId = Number(appointmentId.replace('lead-', ''));

            if (!Number.isFinite(leadId) || leadId <= 0) {
                res.status(400).json({ error: 'ID de lead inválido' });
                return;
            }

            try {
                const changes = await LeadRepository.delete(leadId, clinicId);

                if (changes === 0) {
                    res.status(404).json({ error: 'Agendamento não encontrado' });
                    return;
                }

                res.json({ success: true, message: 'Agendamento excluído', source: 'lead' });
            } catch (error) {
                res.status(500).json({ error: (error as Error).message });
            }

            return;
        }

        db.run(
            `DELETE FROM appointments WHERE id = ? AND clinic_id = ?`,
            [appointmentId, clinicId],
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (this.changes === 0) {
                    res.status(404).json({ error: 'Agendamento não encontrado' });
                    return;
                }

                res.json({ success: true, message: 'Agendamento excluído' });
            }
        );
    }

    /**
     * POST /api/appointments - Create a new appointment
     */
    static createAppointment(req: Request, res: Response): void {
        const clinicId = req.clinicId;

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        const {
            patient_name,
            patient_phone,
            patient_id,
            doctor_id,
            appointment_date,
            start_time,
            end_time,
            duration_minutes,
            status,
            notes,
            insurance,
        } = req.body;

        if (!patient_name || !appointment_date) {
            res.status(400).json({
                error: 'Nome do paciente e data do agendamento são obrigatórios',
            });
            return;
        }

        const startTime = start_time || appointment_date;
        const durationMins = duration_minutes || 60;
        let endTime = end_time;

        // Calculate end_time if not provided
        if (!endTime && startTime) {
            const startDate = new Date(startTime);
            startDate.setMinutes(startDate.getMinutes() + durationMins);
            endTime = startDate.toISOString();
        }

        const sql = `
            INSERT INTO appointments (
                clinic_id, patient_id, patient_name, patient_phone, doctor_id,
                appointment_date, start_time, end_time, duration_minutes,
                status, notes, insurance, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;

        const params = [
            clinicId,
            patient_id || null,
            patient_name,
            patient_phone || null,
            doctor_id || null,
            appointment_date,
            startTime,
            endTime,
            durationMins,
            status || 'scheduled',
            notes || null,
            insurance || 'Particular',
        ];

        db.run(sql, params, function (err) {
            if (err) {
                console.error('Error creating appointment:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            res.status(201).json({
                success: true,
                message: 'Agendamento criado com sucesso',
                id: this.lastID,
            });
        });
    }

    /**
     * GET /api/appointments/archived
     * Get all archived/cancelled appointments (unified from appointments + leads)
     */
    static getArchivedAppointments(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const {
            search,
            status,
            dateFrom,
            dateTo,
            limit = '50',
            offset = '0',
        } = req.query as {
            search?: string;
            status?: string; // 'completed', 'cancelled', 'no_show', 'all'
            dateFrom?: string;
            dateTo?: string;
            limit?: string;
            offset?: string;
        };

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        const limitNum = parseInt(limit, 10) || 50;
        const offsetNum = parseInt(offset, 10) || 0;

        // Build status filter - include completed, cancelled, no_show, archived
        const archivedStatuses = ['completed', 'cancelled', 'no_show', 'archived'];
        let statusFilter = archivedStatuses;
        if (status && status !== 'all') {
            statusFilter = [status];
        }
        const statusPlaceholders = statusFilter.map(() => '?').join(', ');

        // Build search condition
        let searchCondition = '';
        if (search) {
            searchCondition = 'AND (LOWER(patient_name) LIKE ? OR LOWER(patient_phone) LIKE ?)';
        }

        // Build date condition
        let dateCondition = '';
        if (dateFrom) {
            dateCondition += ' AND date(appointment_date) >= date(?)';
        }
        if (dateTo) {
            dateCondition += ' AND date(appointment_date) <= date(?)';
        }

        // Query for archived appointments
        const appointmentsQuery = `
            SELECT
                a.id,
                'appointment' as source,
                a.clinic_id,
                COALESCE(a.patient_name, p.name) as patient_name,
                COALESCE(a.patient_phone, p.phone) as patient_phone,
                COALESCE(a.start_time, a.appointment_date) as appointment_date,
                a.status,
                a.notes,
                a.type,
                a.doctor,
                a.insurance,
                a.updated_at as archived_at
            FROM appointments a
            LEFT JOIN patients p ON p.id = a.patient_id
            WHERE a.clinic_id = ? 
            AND a.status IN (${statusPlaceholders})
            ${searchCondition.replace(/patient_name/g, 'COALESCE(a.patient_name, p.name)').replace(/patient_phone/g, 'COALESCE(a.patient_phone, p.phone)')}
            ${dateCondition.replace(/appointment_date/g, 'COALESCE(a.start_time, a.appointment_date)')}
        `;

        // Query for archived leads
        const leadsQuery = `
            SELECT
                ('lead-' || l.id) as id,
                'lead' as source,
                l.clinic_id,
                l.name as patient_name,
                l.phone as patient_phone,
                l.appointment_date,
                l.status,
                l.notes,
                l.type,
                l.doctor,
                NULL as insurance,
                l.updated_at as archived_at
            FROM leads l
            WHERE l.clinic_id = ?
            AND l.status IN (${statusPlaceholders})
            ${searchCondition.replace(/patient_name/g, 'l.name').replace(/patient_phone/g, 'l.phone')}
            ${dateCondition.replace(/appointment_date/g, 'l.appointment_date')}
        `;

        // Combined query with UNION ALL
        const combinedQuery = `
            SELECT * FROM (
                ${appointmentsQuery}
                UNION ALL
                ${leadsQuery}
            ) AS archived
            ORDER BY archived_at DESC
            LIMIT ? OFFSET ?
        `;

        // Build params array
        const buildParams = (baseParams: any[]) => {
            const result = [...baseParams];
            if (search) {
                result.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
            }
            if (dateFrom) result.push(dateFrom);
            if (dateTo) result.push(dateTo);
            return result;
        };

        const appointmentParams = buildParams([clinicId, ...statusFilter]);
        const leadParams = buildParams([clinicId, ...statusFilter]);
        const params = [...appointmentParams, ...leadParams, limitNum, offsetNum];

        db.all(combinedQuery, params, (err, rows) => {
            if (err) {
                console.error('Error fetching archived appointments:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            // Get statistics
            const statsQuery = `
                SELECT 
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status IN ('cancelled', 'archived') THEN 1 ELSE 0 END) as cancelled,
                    SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show
                FROM (
                    SELECT a.status FROM appointments a WHERE a.clinic_id = ? AND a.status IN ('completed', 'cancelled', 'no_show', 'archived')
                    UNION ALL
                    SELECT l.status FROM leads l WHERE l.clinic_id = ? AND l.status IN ('completed', 'cancelled', 'no_show', 'archived')
                )
            `;

            db.get(statsQuery, [clinicId, clinicId], (statsErr, statsRow: any) => {
                // Get count for current filter
                const countQuery = `
                    SELECT COUNT(*) as total FROM (
                        SELECT a.id FROM appointments a 
                        WHERE a.clinic_id = ? AND a.status IN (${statusPlaceholders})
                        ${search ? "AND (LOWER(COALESCE(a.patient_name, '')) LIKE ? OR LOWER(COALESCE(a.patient_phone, '')) LIKE ?)" : ''}
                        ${dateFrom ? 'AND date(COALESCE(a.start_time, a.appointment_date)) >= date(?)' : ''}
                        ${dateTo ? 'AND date(COALESCE(a.start_time, a.appointment_date)) <= date(?)' : ''}
                        UNION ALL
                        SELECT l.id FROM leads l 
                        WHERE l.clinic_id = ? AND l.status IN (${statusPlaceholders})
                        ${search ? 'AND (LOWER(l.name) LIKE ? OR LOWER(l.phone) LIKE ?)' : ''}
                        ${dateFrom ? 'AND date(l.appointment_date) >= date(?)' : ''}
                        ${dateTo ? 'AND date(l.appointment_date) <= date(?)' : ''}
                    )
                `;

                const countParams = [...appointmentParams, ...leadParams];

                db.get(countQuery, countParams, (countErr, countRow: any) => {
                    res.json({
                        archived: rows || [],
                        total: countRow?.total || 0,
                        limit: limitNum,
                        offset: offsetNum,
                        stats: {
                            completed: statsRow?.completed || 0,
                            cancelled: statsRow?.cancelled || 0,
                            no_show: statsRow?.no_show || 0,
                            restored_today: 0, // TODO: track restored today
                        },
                    });
                });
            });
        });
    }

    /**
     * POST /api/appointments/:id/restore
     * Restore an archived appointment back to scheduled status
     */
    static restoreAppointment(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const { id } = req.params;

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        const appointmentId = Array.isArray(id) ? id[0] : id;

        // Check if it's a lead
        if (appointmentId.startsWith('lead-')) {
            const leadId = Number(appointmentId.replace('lead-', ''));

            LeadRepository.update(leadId, { status: 'agendado' }, clinicId)
                .then((changes) => {
                    if (changes === 0) {
                        res.status(404).json({ error: 'Lead não encontrado' });
                        return;
                    }
                    res.json({ success: true, message: 'Agendamento restaurado' });
                })
                .catch((error) => {
                    res.status(500).json({ error: error.message });
                });
            return;
        }

        // Regular appointment
        db.run(
            `UPDATE appointments SET status = 'scheduled', updated_at = datetime('now') 
             WHERE id = ? AND clinic_id = ?`,
            [appointmentId, clinicId],
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                if (this.changes === 0) {
                    res.status(404).json({ error: 'Agendamento não encontrado' });
                    return;
                }
                res.json({ success: true, message: 'Agendamento restaurado' });
            }
        );
    }
}
