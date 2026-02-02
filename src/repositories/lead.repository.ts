/**
 * ============================================================================
 * LEAD REPOSITORY - TechLog Clinic OS
 * ============================================================================
 *
 * ÚNICO lugar onde queries SQL de leads devem existir.
 * Controllers e Services NUNCA devem escrever SQL diretamente.
 *
 * @usage
 * import { LeadRepository } from '../repositories/lead.repository';
 * const lead = await LeadRepository.findById(1, clinicId);
 */

import { dbAsync } from '../config/database.config';

// ============================================================================
// TYPES
// ============================================================================

export type LeadStatus = 'novo' | 'em_atendimento' | 'agendado' | 'finalizado' | 'archived';
export type LeadType = 'whatsapp' | 'telefone' | 'indicacao' | 'site' | 'instagram' | 'outro';
export type AttendanceStatus = 'compareceu' | 'faltou' | 'remarcou' | 'cancelou';

export interface Lead {
    id: number;
    name: string;
    phone: string;
    type: LeadType;
    status: LeadStatus;
    notes?: string;
    doctor?: string;
    appointment_date?: string;
    attendance_status?: AttendanceStatus;
    archive_reason?: string;
    clinic_id: number;
    status_updated_at?: string;
    created_at: string;
    updated_at?: string;
}

export interface CreateLeadDTO {
    name: string;
    phone: string;
    type?: LeadType;
    clinic_id?: number;
}

export interface UpdateLeadDTO {
    status?: LeadStatus;
    appointment_date?: string | null;
    doctor?: string | null;
    notes?: string | null;
    type?: LeadType;
    attendance_status?: AttendanceStatus | null;
    archive_reason?: string | null;
}

export interface LeadFilters {
    status?: LeadStatus | LeadStatus[];
    excludeStatus?: LeadStatus;
    search?: string;
    date?: string;
    doctor?: string;
    period?: 'today' | '7days' | '30days' | 'thisMonth' | 'all';
    showArchived?: boolean;
    limit?: number;
    offset?: number;
}

export interface LeadMetrics {
    total: number;
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
    byAttendanceStatus: { attendance_status: string; count: number }[];
    history: { date: string; count: number }[];
}

// ============================================================================
// REPOSITORY
// ============================================================================

export class LeadRepository {
    /**
     * Busca lead por ID
     */
    static async findById(id: number, clinicId?: number): Promise<Lead | null> {
        let sql = `SELECT * FROM leads WHERE id = ?`;
        const params: any[] = [id];

        if (clinicId) {
            sql += ` AND clinic_id = ?`;
            params.push(clinicId);
        }

        return dbAsync.get<Lead>(sql, params);
    }

    /**
     * Busca todos os leads com filtros
     */
    static async findAll(clinicId?: number, filters: LeadFilters = {}): Promise<Lead[]> {
        let sql = `SELECT * FROM leads WHERE 1=1`;
        const params: any[] = [];

        // Filtro de clínica (multi-tenant)
        if (clinicId) {
            sql += ` AND clinic_id = ?`;
            params.push(clinicId);
        }

        // Arquivados ou não
        if (filters.showArchived) {
            sql += ` AND status = 'archived'`;
        } else if (filters.excludeStatus) {
            sql += ` AND status != ?`;
            params.push(filters.excludeStatus);
        }

        // Filtro de status específico
        if (filters.status) {
            if (Array.isArray(filters.status)) {
                sql += ` AND status IN (${filters.status.map(() => '?').join(',')})`;
                params.push(...filters.status);
            } else {
                sql += ` AND status = ?`;
                params.push(filters.status);
            }
        }

        // Filtro de busca (nome ou telefone)
        if (filters.search) {
            sql += ` AND (name LIKE ? OR phone LIKE ?)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }

        // Filtro de data específica (para agenda)
        if (filters.date) {
            sql += ` AND date(appointment_date) = date(?)`;
            params.push(filters.date);
        }

        // Filtro de médico
        if (filters.doctor) {
            sql += ` AND doctor = ?`;
            params.push(filters.doctor);
        }

        // Ordenação
        sql += ` ORDER BY created_at DESC`;

        // Paginação
        if (filters.limit) {
            sql += ` LIMIT ?`;
            params.push(filters.limit);
            if (filters.offset) {
                sql += ` OFFSET ?`;
                params.push(filters.offset);
            }
        }

        return dbAsync.all<Lead>(sql, params);
    }

    /**
     * Busca leads para view Kanban com filtro inteligente de período
     */
    static async findForKanban(clinicId?: number, period?: string): Promise<Lead[]> {
        let dateFilter = '';

        if (period && period !== 'all') {
            switch (period) {
                case 'today':
                    dateFilter = "datetime('now', 'start of day')";
                    break;
                case '7days':
                    dateFilter = "datetime('now', '-7 days')";
                    break;
                case '30days':
                    dateFilter = "datetime('now', '-30 days')";
                    break;
                case 'thisMonth':
                    dateFilter = "datetime('now', 'start of month')";
                    break;
                default:
                    dateFilter = "datetime('now', '-7 days')";
            }
        }

        let sql = `SELECT * FROM leads WHERE status != 'archived'`;
        const params: any[] = [];

        if (clinicId) {
            sql += ` AND clinic_id = ?`;
            params.push(clinicId);
        }

        if (dateFilter) {
            sql += `
                AND (
                    status IN ('novo', 'em_atendimento')
                    OR
                    (status = 'agendado' 
                     AND appointment_date IS NOT NULL
                     AND datetime(appointment_date) >= ${dateFilter})
                    OR
                    (status IN ('finalizado', 'Finalizado')
                     AND (
                       (updated_at IS NOT NULL AND datetime(updated_at) >= ${dateFilter})
                       OR
                       (updated_at IS NULL AND datetime(created_at) >= ${dateFilter})
                     ))
                )
            `;
        }

        sql += `
            ORDER BY 
                CASE 
                    WHEN status = 'novo' THEN 1
                    WHEN status = 'em_atendimento' THEN 2
                    WHEN status = 'agendado' THEN 3
                    WHEN status IN ('finalizado', 'Finalizado') THEN 4
                    ELSE 5
                END,
                created_at DESC
        `;

        return dbAsync.all<Lead>(sql, params);
    }

    /**
     * Busca leads para agenda (por data)
     */
    static async findForAgenda(
        targetDate: string,
        clinicId?: number,
        doctor?: string
    ): Promise<Lead[]> {
        let sql = `
            SELECT * FROM leads 
            WHERE date(appointment_date) = date(?)
              AND status != 'archived'
        `;
        const params: any[] = [targetDate];

        if (clinicId) {
            sql += ` AND clinic_id = ?`;
            params.push(clinicId);
        }

        if (doctor) {
            sql += ` AND doctor = ?`;
            params.push(doctor);
        }

        sql += ` ORDER BY appointment_date ASC`;

        return dbAsync.all<Lead>(sql, params);
    }

    /**
     * Cria um novo lead
     */
    static async create(data: CreateLeadDTO): Promise<number> {
        const sql = `
            INSERT INTO leads (name, phone, type, clinic_id, status, created_at)
            VALUES (?, ?, ?, ?, 'novo', datetime('now'))
        `;
        const params = [data.name, data.phone, data.type || 'whatsapp', data.clinic_id || null];

        const result = await dbAsync.run(sql, params);
        return result.lastID;
    }

    /**
     * Atualiza um lead
     */
    static async update(id: number, data: UpdateLeadDTO, clinicId?: number): Promise<number> {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.status !== undefined) {
            updates.push('status = ?');
            values.push(data.status);
            updates.push('status_updated_at = CURRENT_TIMESTAMP');
        }
        if (data.appointment_date !== undefined) {
            updates.push('appointment_date = ?');
            values.push(data.appointment_date);
        }
        if (data.doctor !== undefined) {
            updates.push('doctor = ?');
            values.push(data.doctor);
        }
        if (data.notes !== undefined) {
            updates.push('notes = ?');
            values.push(data.notes);
        }
        if (data.type !== undefined) {
            updates.push('type = ?');
            values.push(data.type);
        }
        if (data.attendance_status !== undefined) {
            updates.push('attendance_status = ?');
            values.push(data.attendance_status);
        }
        if (data.archive_reason !== undefined) {
            updates.push('archive_reason = ?');
            values.push(data.archive_reason);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        let sql = `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`;
        values.push(id);

        if (clinicId) {
            sql += ` AND clinic_id = ?`;
            values.push(clinicId);
        }

        const result = await dbAsync.run(sql, values);
        return result.changes;
    }

    /**
     * Arquiva um lead
     */
    static async archive(id: number, reason?: string, clinicId?: number): Promise<number> {
        let sql = `UPDATE leads SET status = 'archived', updated_at = CURRENT_TIMESTAMP`;
        const params: any[] = [];

        if (reason) {
            sql += `, archive_reason = ?`;
            params.push(reason);
        }

        sql += ` WHERE id = ?`;
        params.push(id);

        if (clinicId) {
            sql += ` AND clinic_id = ?`;
            params.push(clinicId);
        }

        const result = await dbAsync.run(sql, params);
        return result.changes;
    }

    /**
     * Restaura um lead arquivado
     */
    static async unarchive(id: number, clinicId?: number): Promise<number> {
        let sql = `
            UPDATE leads 
            SET status = 'novo', archive_reason = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const params: any[] = [id];

        if (clinicId) {
            sql += ` AND clinic_id = ?`;
            params.push(clinicId);
        }

        const result = await dbAsync.run(sql, params);
        return result.changes;
    }

    /**
     * Deleta um lead (soft delete: arquiva com motivo)
     * Para hard delete, use deleteHard
     */
    static async delete(id: number, clinicId?: number): Promise<number> {
        return this.archive(id, 'Removido pelo usuário', clinicId);
    }

    /**
     * Deleta permanentemente um lead (use com cuidado!)
     */
    static async deleteHard(id: number, clinicId?: number): Promise<number> {
        let sql = `DELETE FROM leads WHERE id = ?`;
        const params: any[] = [id];

        if (clinicId) {
            sql += ` AND clinic_id = ?`;
            params.push(clinicId);
        }

        const result = await dbAsync.run(sql, params);
        return result.changes;
    }

    /**
     * Retorna métricas dos leads
     */
    static async getMetrics(clinicId?: number): Promise<LeadMetrics> {
        let whereClause = '';
        const params: any[] = [];

        if (clinicId) {
            whereClause = ' WHERE clinic_id = ?';
            params.push(clinicId);
        }

        // Total
        const totalResult = await dbAsync.get<{ total: number }>(
            `SELECT COUNT(*) as total FROM leads${whereClause}`,
            params
        );

        // Por status
        const byStatus = await dbAsync.all<{ status: string; count: number }>(
            `SELECT status, COUNT(*) as count FROM leads${whereClause} GROUP BY status`,
            params
        );

        // Por tipo
        const byType = await dbAsync.all<{ type: string; count: number }>(
            `SELECT type, COUNT(*) as count FROM leads${whereClause} GROUP BY type`,
            params
        );

        // Por resultado de atendimento
        const byAttendanceStatus = await dbAsync.all<{ attendance_status: string; count: number }>(
            `SELECT attendance_status, COUNT(*) as count FROM leads${whereClause} AND attendance_status IS NOT NULL GROUP BY attendance_status`.replace(
                '${whereClause} AND',
                whereClause ? `${whereClause} AND` : ' WHERE'
            ),
            params
        );

        // Histórico dos últimos 7 dias
        const history = await dbAsync.all<{ date: string; count: number }>(
            `SELECT date(created_at) as date, COUNT(*) as count FROM leads${whereClause} GROUP BY date(created_at) ORDER BY date(created_at) DESC LIMIT 7`,
            params
        );

        return {
            total: totalResult?.total || 0,
            byStatus,
            byType,
            byAttendanceStatus,
            history: history.reverse(),
        };
    }

    /**
     * Conta leads por filtro
     */
    static async count(clinicId?: number, filters: LeadFilters = {}): Promise<number> {
        let sql = `SELECT COUNT(*) as count FROM leads WHERE 1=1`;
        const params: any[] = [];

        if (clinicId) {
            sql += ` AND clinic_id = ?`;
            params.push(clinicId);
        }

        if (filters.status) {
            sql += ` AND status = ?`;
            params.push(filters.status);
        }

        if (filters.excludeStatus) {
            sql += ` AND status != ?`;
            params.push(filters.excludeStatus);
        }

        const result = await dbAsync.get<{ count: number }>(sql, params);
        return result?.count || 0;
    }
}
