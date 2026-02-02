/**
 * ============================================================================
 * PATIENT SERVICE - TechLog Clinic OS
 * ============================================================================
 *
 * Lógica de negócio relacionada a pacientes.
 * Controllers chamam Services, Services chamam Repositories.
 *
 * @usage
 * import { PatientService } from '../services/patient.service';
 * const patient = await PatientService.findById(1, clinicId);
 */

import {
    PatientRepository,
    Patient,
    CreatePatientDTO,
    UpdatePatientDTO,
    PatientFilters,
} from '../repositories/patient.repository';
import { NotFoundError, ValidationError, ConflictError } from '../shared/errors';
import {
    PATIENT_STATUSES,
    PATIENT_STATUS_VALUES,
    PatientStatus,
    ERROR_MESSAGES,
} from '../config/constants';

// ============================================================================
// SERVICE
// ============================================================================

export class PatientService {
    /**
     * Busca paciente por ID
     * @throws NotFoundError se paciente não existir
     */
    static async findById(id: number, clinicId: number): Promise<Patient> {
        if (!Number.isFinite(id) || id <= 0) {
            throw new ValidationError(ERROR_MESSAGES.PATIENT.INVALID_ID);
        }

        const patient = await PatientRepository.findById(id, clinicId);

        if (!patient) {
            throw new NotFoundError(ERROR_MESSAGES.PATIENT.NOT_FOUND);
        }

        return patient;
    }

    /**
     * Lista todos os pacientes com filtros
     */
    static async findAll(clinicId: number, filters: PatientFilters = {}): Promise<Patient[]> {
        return PatientRepository.findAll(clinicId, filters);
    }

    /**
     * Busca pacientes por status (para Kanban)
     */
    static async findByStatus(clinicId: number, status: PatientStatus): Promise<Patient[]> {
        if (!PATIENT_STATUS_VALUES.includes(status)) {
            throw new ValidationError(ERROR_MESSAGES.PATIENT.INVALID_STATUS);
        }

        return PatientRepository.findByStatus(clinicId, status);
    }

    /**
     * Retorna contagem de pacientes por status
     */
    static async getStatusCounts(clinicId: number): Promise<Record<PatientStatus, number>> {
        return PatientRepository.countByStatus(clinicId);
    }

    /**
     * Cria novo paciente
     * @throws ConflictError se CPF já existir
     */
    static async create(data: CreatePatientDTO): Promise<Patient> {
        // Validações de negócio
        if (!data.name?.trim()) {
            throw new ValidationError('Nome é obrigatório');
        }

        if (!data.phone?.trim()) {
            throw new ValidationError('Telefone é obrigatório');
        }

        // Verificar CPF duplicado (se fornecido)
        if (data.cpf) {
            const existing = await PatientRepository.findByCpf(data.cpf, data.clinic_id);
            if (existing) {
                throw new ConflictError('Já existe um paciente com este CPF');
            }
        }

        // Criar paciente
        const id = await PatientRepository.create({
            ...data,
            name: data.name.trim(),
            phone: data.phone.replace(/\D/g, ''), // Remove caracteres não numéricos
        });

        // Retornar paciente criado
        const patient = await PatientRepository.findById(id, data.clinic_id);
        return patient!;
    }

    /**
     * Atualiza dados do paciente
     * @throws NotFoundError se paciente não existir
     */
    static async update(id: number, clinicId: number, data: UpdatePatientDTO): Promise<Patient> {
        // Verificar se paciente existe
        await this.findById(id, clinicId);

        // Se está atualizando CPF, verificar duplicidade
        if (data.cpf) {
            const existing = await PatientRepository.findByCpf(data.cpf, clinicId);
            if (existing && existing.id !== id) {
                throw new ConflictError('Já existe outro paciente com este CPF');
            }
        }

        // Atualizar
        const updated = await PatientRepository.update(id, clinicId, data);

        if (!updated) {
            throw new ValidationError('Nenhum dado foi alterado');
        }

        // Retornar paciente atualizado
        return this.findById(id, clinicId);
    }

    /**
     * Atualiza status do paciente (Kanban)
     * @throws ValidationError se transição de status for inválida
     */
    static async updateStatus(
        id: number,
        clinicId: number,
        newStatus: PatientStatus
    ): Promise<Patient> {
        // Validar status
        if (!PATIENT_STATUS_VALUES.includes(newStatus)) {
            throw new ValidationError(ERROR_MESSAGES.PATIENT.INVALID_STATUS);
        }

        // Buscar paciente atual
        const patient = await this.findById(id, clinicId);

        // Regras de transição de status (opcional - pode ser removido se quiser mais flexibilidade)
        const validTransitions: Record<PatientStatus, PatientStatus[]> = {
            [PATIENT_STATUSES.WAITING]: [PATIENT_STATUSES.TRIAGE, PATIENT_STATUSES.CONSULTATION],
            [PATIENT_STATUSES.TRIAGE]: [PATIENT_STATUSES.WAITING, PATIENT_STATUSES.CONSULTATION],
            [PATIENT_STATUSES.CONSULTATION]: [PATIENT_STATUSES.TRIAGE, PATIENT_STATUSES.FINISHED],
            [PATIENT_STATUSES.FINISHED]: [PATIENT_STATUSES.WAITING], // Pode voltar ao início
        };

        const currentStatus = patient.status as PatientStatus;
        const allowedTransitions = validTransitions[currentStatus] || [];

        if (!allowedTransitions.includes(newStatus) && currentStatus !== newStatus) {
            // Por enquanto, vamos permitir todas as transições mas logar o warning
            console.warn(`⚠️ Transição de status não padrão: ${currentStatus} → ${newStatus}`);
        }

        // Atualizar status
        await PatientRepository.updateStatus(id, clinicId, newStatus);

        // Se está iniciando consulta, marcar start_time
        if (newStatus === PATIENT_STATUSES.CONSULTATION && !patient.start_time) {
            await PatientRepository.startAttendance(id, clinicId);
        }

        // Se está finalizando, marcar end_time
        if (newStatus === PATIENT_STATUSES.FINISHED) {
            await PatientRepository.endAttendance(id, clinicId);
        }

        // Retornar paciente atualizado
        return this.findById(id, clinicId);
    }

    /**
     * Exclui paciente (soft delete)
     */
    static async delete(id: number, clinicId: number): Promise<void> {
        // Verificar se existe
        await this.findById(id, clinicId);

        // Soft delete
        await PatientRepository.softDelete(id, clinicId);
    }

    /**
     * Busca pacientes de hoje (para dashboard)
     */
    static async getTodayPatients(clinicId: number): Promise<Patient[]> {
        return PatientRepository.findTodayPatients(clinicId);
    }

    /**
     * Busca pacientes finalizados hoje (para relatório)
     */
    static async getFinishedToday(clinicId: number): Promise<Patient[]> {
        return PatientRepository.findFinishedToday(clinicId);
    }

    /**
     * Obtém métricas do dia
     */
    static async getDailyMetrics(clinicId: number): Promise<{
        total: number;
        waiting: number;
        inProgress: number;
        finished: number;
    }> {
        const counts = await PatientRepository.countByStatus(clinicId);
        const todayPatients = await PatientRepository.findTodayPatients(clinicId);

        return {
            total: todayPatients.length,
            waiting: counts[PATIENT_STATUSES.WAITING] || 0,
            inProgress:
                (counts[PATIENT_STATUSES.TRIAGE] || 0) +
                (counts[PATIENT_STATUSES.CONSULTATION] || 0),
            finished: counts[PATIENT_STATUSES.FINISHED] || 0,
        };
    }
}
