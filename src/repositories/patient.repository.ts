/**
 * ============================================================================
 * PATIENT REPOSITORY - TechLog Clinic OS
 * ============================================================================
 *
 * ÚNICO lugar onde queries SQL de pacientes devem existir.
 * Controllers e Services NUNCA devem escrever SQL diretamente.
 *
 * @usage
 * import { PatientRepository } from '../repositories/patient.repository';
 * const patient = await PatientRepository.findById(1, clinicId);
 */

import { dbAsync } from '../config/database.config';
import { PatientStatus } from '../config/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface Patient {
    id: number;
    name: string;
    phone: string;
    cpf?: string;
    email?: string;
    birth_date?: string;
    address?: string;
    insurance?: string;
    notes?: string;
    status: PatientStatus;
    clinic_id: number;
    start_time?: string;
    end_time?: string;
    created_at: string;
    updated_at?: string;
    deleted_at?: string;
}

export interface CreatePatientDTO {
    name: string;
    phone: string;
    cpf?: string;
    email?: string;
    birth_date?: string;
    address?: string;
    insurance?: string;
    notes?: string;
    clinic_id: number;
}

export interface UpdatePatientDTO {
    name?: string;
    phone?: string;
    cpf?: string;
    email?: string;
    birth_date?: string;
    address?: string;
    insurance?: string;
    notes?: string;
}

export interface PatientFilters {
    status?: PatientStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

// ============================================================================
// REPOSITORY
// ============================================================================

export class PatientRepository {
    /**
     * Busca paciente por ID
     */
    static async findById(id: number, clinicId: number): Promise<Patient | null> {
        return dbAsync.get<Patient>(
            `SELECT * FROM patients 
             WHERE id = ? AND clinic_id = ? AND deleted_at IS NULL`,
            [id, clinicId]
        );
    }

    /**
     * Busca todos os pacientes da clínica
     */
    static async findAll(clinicId: number, filters: PatientFilters = {}): Promise<Patient[]> {
        let sql = `SELECT * FROM patients WHERE clinic_id = ? AND deleted_at IS NULL`;
        const params: any[] = [clinicId];

        if (filters.status) {
            sql += ` AND status = ?`;
            params.push(filters.status);
        }

        if (filters.search) {
            sql += ` AND (name LIKE ? OR phone LIKE ? OR cpf LIKE ?)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (filters.startDate) {
            sql += ` AND date(created_at) >= date(?)`;
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            sql += ` AND date(created_at) <= date(?)`;
            params.push(filters.endDate);
        }

        sql += ` ORDER BY created_at DESC`;

        if (filters.limit) {
            sql += ` LIMIT ?`;
            params.push(filters.limit);

            if (filters.offset) {
                sql += ` OFFSET ?`;
                params.push(filters.offset);
            }
        }

        return dbAsync.all<Patient>(sql, params);
    }

    /**
     * Busca pacientes por status (para Kanban)
     */
    static async findByStatus(clinicId: number, status: PatientStatus): Promise<Patient[]> {
        return dbAsync.all<Patient>(
            `SELECT * FROM patients 
             WHERE clinic_id = ? AND status = ? AND deleted_at IS NULL
             ORDER BY start_time ASC`,
            [clinicId, status]
        );
    }

    /**
     * Conta pacientes por status (para métricas)
     */
    static async countByStatus(clinicId: number): Promise<Record<PatientStatus, number>> {
        const rows = await dbAsync.all<{ status: PatientStatus; count: number }>(
            `SELECT status, COUNT(*) as count FROM patients 
             WHERE clinic_id = ? AND deleted_at IS NULL
             GROUP BY status`,
            [clinicId]
        );

        const counts: Record<string, number> = {
            waiting: 0,
            triage: 0,
            consultation: 0,
            finished: 0,
        };

        for (const row of rows) {
            counts[row.status] = row.count;
        }

        return counts as Record<PatientStatus, number>;
    }

    /**
     * Conta total de pacientes da clínica
     */
    static async count(clinicId: number): Promise<number> {
        const result = await dbAsync.get<{ count: number }>(
            `SELECT COUNT(*) as count FROM patients 
             WHERE clinic_id = ? AND deleted_at IS NULL`,
            [clinicId]
        );
        return result?.count || 0;
    }

    /**
     * Cria novo paciente
     */
    static async create(data: CreatePatientDTO): Promise<number> {
        const result = await dbAsync.run(
            `INSERT INTO patients (name, phone, cpf, email, birth_date, address, insurance, notes, clinic_id, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting')`,
            [
                data.name,
                data.phone,
                data.cpf || null,
                data.email || null,
                data.birth_date || null,
                data.address || null,
                data.insurance || null,
                data.notes || null,
                data.clinic_id,
            ]
        );
        return result.lastID;
    }

    /**
     * Atualiza dados do paciente
     */
    static async update(id: number, clinicId: number, data: UpdatePatientDTO): Promise<boolean> {
        const fields: string[] = [];
        const params: any[] = [];

        if (data.name !== undefined) {
            fields.push('name = ?');
            params.push(data.name);
        }
        if (data.phone !== undefined) {
            fields.push('phone = ?');
            params.push(data.phone);
        }
        if (data.cpf !== undefined) {
            fields.push('cpf = ?');
            params.push(data.cpf);
        }
        if (data.email !== undefined) {
            fields.push('email = ?');
            params.push(data.email);
        }
        if (data.birth_date !== undefined) {
            fields.push('birth_date = ?');
            params.push(data.birth_date);
        }
        if (data.address !== undefined) {
            fields.push('address = ?');
            params.push(data.address);
        }
        if (data.insurance !== undefined) {
            fields.push('insurance = ?');
            params.push(data.insurance);
        }
        if (data.notes !== undefined) {
            fields.push('notes = ?');
            params.push(data.notes);
        }

        if (fields.length === 0) {
            return false;
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id, clinicId);

        const result = await dbAsync.run(
            `UPDATE patients SET ${fields.join(', ')} WHERE id = ? AND clinic_id = ?`,
            params
        );

        return result.changes > 0;
    }

    /**
     * Atualiza status do paciente
     */
    static async updateStatus(
        id: number,
        clinicId: number,
        status: PatientStatus
    ): Promise<boolean> {
        const result = await dbAsync.run(
            `UPDATE patients 
             SET status = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND clinic_id = ? AND deleted_at IS NULL`,
            [status, id, clinicId]
        );
        return result.changes > 0;
    }

    /**
     * Marca início de atendimento
     */
    static async startAttendance(id: number, clinicId: number): Promise<boolean> {
        const result = await dbAsync.run(
            `UPDATE patients 
             SET start_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND clinic_id = ? AND deleted_at IS NULL`,
            [id, clinicId]
        );
        return result.changes > 0;
    }

    /**
     * Marca fim de atendimento
     */
    static async endAttendance(id: number, clinicId: number): Promise<boolean> {
        const result = await dbAsync.run(
            `UPDATE patients 
             SET end_time = CURRENT_TIMESTAMP, status = 'finished', updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND clinic_id = ? AND deleted_at IS NULL`,
            [id, clinicId]
        );
        return result.changes > 0;
    }

    /**
     * Soft delete do paciente
     */
    static async softDelete(id: number, clinicId: number): Promise<boolean> {
        const result = await dbAsync.run(
            `UPDATE patients 
             SET deleted_at = CURRENT_TIMESTAMP 
             WHERE id = ? AND clinic_id = ?`,
            [id, clinicId]
        );
        return result.changes > 0;
    }

    /**
     * Hard delete (apenas para testes)
     */
    static async hardDelete(id: number, clinicId: number): Promise<boolean> {
        const result = await dbAsync.run(`DELETE FROM patients WHERE id = ? AND clinic_id = ?`, [
            id,
            clinicId,
        ]);
        return result.changes > 0;
    }

    /**
     * Busca paciente por CPF (para evitar duplicados)
     */
    static async findByCpf(cpf: string, clinicId: number): Promise<Patient | null> {
        return dbAsync.get<Patient>(
            `SELECT * FROM patients 
             WHERE cpf = ? AND clinic_id = ? AND deleted_at IS NULL`,
            [cpf, clinicId]
        );
    }

    /**
     * Busca paciente por telefone
     */
    static async findByPhone(phone: string, clinicId: number): Promise<Patient | null> {
        return dbAsync.get<Patient>(
            `SELECT * FROM patients 
             WHERE phone = ? AND clinic_id = ? AND deleted_at IS NULL`,
            [phone, clinicId]
        );
    }

    /**
     * Busca pacientes atendidos hoje
     */
    static async findTodayPatients(clinicId: number): Promise<Patient[]> {
        return dbAsync.all<Patient>(
            `SELECT * FROM patients 
             WHERE clinic_id = ? 
               AND date(created_at) = date('now')
               AND deleted_at IS NULL
             ORDER BY created_at ASC`,
            [clinicId]
        );
    }

    /**
     * Busca pacientes finalizados hoje (para relatório)
     */
    static async findFinishedToday(clinicId: number): Promise<Patient[]> {
        return dbAsync.all<Patient>(
            `SELECT * FROM patients 
             WHERE clinic_id = ? 
               AND status = 'finished'
               AND date(end_time) = date('now')
               AND deleted_at IS NULL
             ORDER BY end_time DESC`,
            [clinicId]
        );
    }
}
