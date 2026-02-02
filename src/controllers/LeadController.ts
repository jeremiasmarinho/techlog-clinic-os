/**
 * ============================================================================
 * LEAD CONTROLLER - TechLog Clinic OS (Refatorado)
 * ============================================================================
 *
 * Controller de Leads usando:
 * - LeadRepository para acesso ao banco
 * - Validators Zod para validação
 * - Respostas padronizadas
 * - Async/Await (sem callbacks)
 *
 * @usage Rotas em routes/lead.routes.ts
 */

import { Request, Response } from 'express';
import { LeadRepository } from '../repositories/lead.repository';
import { createLeadSchema, updateLeadSchema } from '../validators/lead.validator';
import {
    sendSuccess,
    sendCreated,
    sendValidationError,
    sendNotFound,
} from '../shared/api-response';
import { asyncHandler } from '../middleware/error.middleware';

// Helper para extrair ID de params de forma segura
const getParamId = (id: string | string[]): number => parseInt(Array.isArray(id) ? id[0] : id, 10);

export class LeadController {
    /**
     * GET /api/leads
     * Lista leads com filtros
     */
    static index = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const view = req.query.view as string;
        const showArchived = req.query.show_archived === 'true';
        const date = req.query.date as string;
        const doctor = req.query.doctor as string;
        const period = req.query.period as string;

        const user = (req as any).user;
        const clinicId = user?.role !== 'super_admin' ? (req as any).clinicId : undefined;

        let leads;

        if (showArchived) {
            leads = await LeadRepository.findAll(clinicId, { showArchived: true });
        } else if (view === 'agenda') {
            const targetDate = date || new Date().toISOString().split('T')[0];
            leads = await LeadRepository.findForAgenda(targetDate, clinicId, doctor);
        } else if (view === 'kanban') {
            leads = await LeadRepository.findForKanban(clinicId, period);
        } else {
            leads = await LeadRepository.findAll(clinicId, { excludeStatus: 'archived' });
        }

        // Manter compatibilidade - retorna array direto para não quebrar frontend
        res.json(leads);
    });

    /**
     * GET /api/leads/:id
     * Busca lead por ID
     */
    static show = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const clinicId = (req as any).clinicId;

        const lead = await LeadRepository.findById(getParamId(id), clinicId);

        if (!lead) {
            sendNotFound(res, 'Lead não encontrado');
            return;
        }

        sendSuccess(res, lead);
    });

    /**
     * POST /api/leads
     * Cria novo lead
     */
    static create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        // Validar com Zod
        const result = createLeadSchema.safeParse(req.body);
        if (!result.success) {
            const formatted = result.error.format();
            const firstError =
                Object.keys(formatted)
                    .filter((k) => k !== '_errors')
                    .map((k) => (formatted as any)[k]._errors?.[0])
                    .find((e) => e) || 'Erro de validação';
            sendValidationError(res, firstError);
            return;
        }

        const { name, phone, type } = result.data;
        const clinicId = (req as any).clinicId;

        const id = await LeadRepository.create({
            name,
            phone,
            type: type as any,
            clinic_id: clinicId,
        });

        sendCreated(res, {
            id,
            message: 'Lead salvo com sucesso!',
        });
    });

    /**
     * PATCH /api/leads/:id
     * Atualiza lead
     */
    static update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const clinicId = (req as any).clinicId;

        // Validar com Zod
        const result = updateLeadSchema.safeParse(req.body);
        if (!result.success) {
            const formatted = result.error.format();
            const firstError =
                Object.keys(formatted)
                    .filter((k) => k !== '_errors')
                    .map((k) => (formatted as any)[k]._errors?.[0])
                    .find((e) => e) || 'Erro de validação';
            sendValidationError(res, firstError);
            return;
        }

        const changes = await LeadRepository.update(getParamId(id), result.data as any, clinicId);

        sendSuccess(res, {
            message: 'Lead atualizado!',
            changes,
        });
    });

    /**
     * DELETE /api/leads/:id
     * Remove lead (soft delete - arquiva)
     */
    static delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const clinicId = (req as any).clinicId;

        const changes = await LeadRepository.delete(getParamId(id), clinicId);

        sendSuccess(res, {
            message: 'Lead removido.',
            changes,
        });
    });

    /**
     * PUT /api/leads/:id/archive
     * Arquiva lead
     */
    static archive = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const { archive_reason } = req.body;
        const clinicId = (req as any).clinicId;

        const changes = await LeadRepository.archive(getParamId(id), archive_reason, clinicId);

        sendSuccess(res, {
            message: 'Lead arquivado com sucesso!',
            changes,
        });
    });

    /**
     * PUT /api/leads/:id/unarchive
     * Restaura lead arquivado
     */
    static unarchive = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const clinicId = (req as any).clinicId;

        const changes = await LeadRepository.unarchive(getParamId(id), clinicId);

        sendSuccess(res, {
            message: 'Lead restaurado com sucesso!',
            changes,
        });
    });

    /**
     * GET /api/leads/metrics
     * Retorna métricas dos leads
     */
    static metrics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const clinicId = (req as any).clinicId;

        const metrics = await LeadRepository.getMetrics(clinicId);

        res.json(metrics);
    });
}

// ============================================================================
// EXPORTS para compatibilidade com rotas existentes
// ============================================================================

export default LeadController;
