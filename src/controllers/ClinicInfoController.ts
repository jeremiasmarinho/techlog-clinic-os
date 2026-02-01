import { Request, Response } from 'express';
import { db } from '../database/index';

/**
 * ClinicInfoController - Endpoint para informações da clínica logada
 */
export class ClinicInfoController {
    /**
     * GET /api/clinic/info
     * Retorna informações detalhadas da clínica do usuário logado
     */
    static getClinicInfo(req: Request, res: Response): void {
        try {
            // Extrair clinicId do contexto injetado pelo middleware
            const clinicId = (req as any).clinicId;
            const user = (req as any).user;

            if (!clinicId) {
                res.status(400).json({
                    success: false,
                    error: 'Clínica não identificada',
                });
                return;
            }

            db.get(
                `SELECT 
                    c.*,
                    u.name as owner_name,
                    u.username as owner_email,
                    (SELECT COUNT(*) FROM users WHERE clinic_id = c.id) as total_users,
                    (SELECT COUNT(*) FROM leads WHERE clinic_id = c.id) as total_leads,
                    (SELECT COUNT(*) FROM patients WHERE clinic_id = c.id) as total_patients
                 FROM clinics c
                 LEFT JOIN users u ON c.owner_id = u.id
                 WHERE c.id = ?`,
                [clinicId],
                (err, clinic: any) => {
                    if (err) {
                        res.status(500).json({ success: false, error: err.message });
                        return;
                    }

                    if (!clinic) {
                        res.status(404).json({
                            success: false,
                            error: 'Clínica não encontrada',
                        });
                        return;
                    }

                    const usersMax = Number(clinic.max_users || 0);
                    const patientsMax = Number(clinic.max_patients || 0);
                    const userProgress = usersMax > 0 ? (clinic.total_users / usersMax) * 100 : 0;
                    const patientProgress =
                        patientsMax > 0 ? (clinic.total_leads / patientsMax) * 100 : 0;

                    const nearUserLimit = userProgress >= 80;
                    const nearPatientLimit = patientProgress >= 80;

                    let trialInfo = null;
                    if (clinic.status === 'trial' && clinic.trial_ends_at) {
                        const trialEnd = new Date(clinic.trial_ends_at);
                        const now = new Date();
                        const daysLeft = Math.ceil(
                            (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        trialInfo = {
                            ends_at: clinic.trial_ends_at,
                            days_left: daysLeft,
                            is_expiring_soon: daysLeft <= 7,
                        };
                    }

                    res.json({
                        success: true,
                        clinic: {
                            id: clinic.id,
                            name: clinic.name,
                            slug: clinic.slug,
                            status: clinic.status,
                            plan_tier: clinic.plan_tier,
                            owner_id: clinic.owner_id,
                            owner_name: clinic.owner_name,
                            owner_email: clinic.owner_email,
                            max_users: clinic.max_users,
                            max_patients: clinic.max_patients,
                            total_users: clinic.total_users,
                            total_leads: clinic.total_leads,
                            total_patients: clinic.total_patients,
                            user_progress: Math.round(userProgress),
                            patient_progress: Math.round(patientProgress),
                            near_user_limit: nearUserLimit,
                            near_patient_limit: nearPatientLimit,
                            trial: trialInfo,
                            subscription_started_at: clinic.subscription_started_at,
                            subscription_ends_at: clinic.subscription_ends_at,
                            created_at: clinic.created_at,
                            updated_at: clinic.updated_at,
                        },
                        user: {
                            id: user.userId,
                            name: user.name,
                            role: user.role,
                            is_owner: user.isOwner,
                        },
                    });
                }
            );
        } catch (error: any) {
            console.error('Erro ao buscar informações da clínica:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar informações da clínica',
                details: error.message,
            });
        }
    }

    /**
     * GET /api/clinic/stats
     * Retorna estatísticas resumidas da clínica
     */
    static getClinicStats(req: Request, res: Response): void {
        try {
            const clinicId = (req as any).clinicId;

            if (!clinicId) {
                res.status(400).json({
                    success: false,
                    error: 'Clínica não identificada',
                });
                return;
            }

            db.get(
                `SELECT 
                    (SELECT COUNT(*) FROM users WHERE clinic_id = ?) as total_users,
                    (SELECT COUNT(*) FROM leads WHERE clinic_id = ?) as total_leads,
                    (SELECT COUNT(*) FROM patients WHERE clinic_id = ?) as total_patients,
                    (SELECT COUNT(*) FROM appointments WHERE clinic_id = ?) as total_appointments,
                    (SELECT COUNT(*) FROM appointments WHERE clinic_id = ?
                        AND appointment_date >= date('now')
                        AND appointment_date <= date('now', '+7 days')
                        AND status != 'cancelled') as upcoming_appointments`,
                [clinicId, clinicId, clinicId, clinicId, clinicId],
                (err, statsRow: any) => {
                    if (err) {
                        res.status(500).json({ success: false, error: err.message });
                        return;
                    }

                    db.all(
                        `SELECT status, COUNT(*) as count
                         FROM leads
                         WHERE clinic_id = ?
                         GROUP BY status`,
                        [clinicId],
                        (leadsErr, leadsByStatus: any[]) => {
                            if (leadsErr) {
                                res.status(500).json({ success: false, error: leadsErr.message });
                                return;
                            }

                            res.json({
                                success: true,
                                stats: {
                                    total_users: statsRow?.total_users ?? 0,
                                    total_leads: statsRow?.total_leads ?? 0,
                                    total_patients: statsRow?.total_patients ?? 0,
                                    total_appointments: statsRow?.total_appointments ?? 0,
                                    upcoming_appointments: statsRow?.upcoming_appointments ?? 0,
                                    leads_by_status: leadsByStatus || [],
                                },
                            });
                        }
                    );
                }
            );
        } catch (error: any) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar estatísticas',
                details: error.message,
            });
        }
    }

    /**
     * POST /api/clinic/upgrade-request
     * Solicita upgrade de plano
     */
    static createUpgradeRequest(req: Request, res: Response): void {
        const clinicId = (req as any).clinicId;
        const user = (req as any).user;
        const { requested_plan, notes } = req.body || {};

        if (!clinicId || !user) {
            res.status(401).json({ success: false, error: 'Não autenticado' });
            return;
        }

        const allowedPlans = ['basic', 'professional', 'enterprise'];
        if (!allowedPlans.includes(requested_plan)) {
            res.status(400).json({ success: false, error: 'Plano solicitado inválido' });
            return;
        }

        db.get('SELECT plan_tier FROM clinics WHERE id = ?', [clinicId], (err, row: any) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
                return;
            }

            const currentPlan = row?.plan_tier || null;

            db.run(
                `INSERT INTO upgrade_requests (clinic_id, current_plan, requested_plan, status, notes)
                 VALUES (?, ?, ?, 'pending', ?)`,
                [clinicId, currentPlan, requested_plan, notes || null],
                function (insertErr) {
                    if (insertErr) {
                        res.status(500).json({ success: false, error: insertErr.message });
                        return;
                    }

                    res.status(201).json({
                        success: true,
                        request: {
                            id: this.lastID,
                            clinic_id: clinicId,
                            requested_plan,
                            status: 'pending',
                        },
                    });
                }
            );
        });
    }

    /**
     * GET /api/clinic/audit-logs
     * Lista logs de auditoria da clínica autenticada
     */
    static getAuditLogs(req: Request, res: Response): void {
        const clinicId = (req as any).clinicId;
        const limit = req.query.limit ? Number(req.query.limit) : 100;

        if (!clinicId) {
            res.status(400).json({ success: false, error: 'Clínica não identificada' });
            return;
        }

        db.all(
            `SELECT * FROM audit_logs WHERE clinic_id = ? ORDER BY created_at DESC LIMIT ?`,
            [clinicId, limit],
            (err, rows) => {
                if (err) {
                    res.status(500).json({ success: false, error: err.message });
                    return;
                }
                res.json({ success: true, logs: rows || [] });
            }
        );
    }
}
