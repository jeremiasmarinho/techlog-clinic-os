import { Request, Response } from 'express';
import { db } from '../database';
import { PrescriptionPdfService } from '../services/PrescriptionPdfService';

export class PrescriptionController {
    /**
     * GET /api/prescriptions/:id/pdf
     */
    static async downloadPdf(req: Request, res: Response): Promise<void> {
        const clinicId = req.clinicId;
        const { id } = req.params;
        const prescriptionId = Number(id);

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        if (!Number.isFinite(prescriptionId)) {
            res.status(400).json({ error: 'ID inválido' });
            return;
        }

        db.get(
            `SELECT 
                p.*, 
                c.name as clinic_name,
                c.logo_url as clinic_logo_url,
                c.primary_color as clinic_primary_color,
                c.address_full as clinic_address_full,
                cs.identity as clinic_identity,
                u.name as doctor_name,
                u.crm as doctor_crm,
                u.crm_state as doctor_crm_state
             FROM prescriptions p
             INNER JOIN clinics c ON c.id = p.clinic_id
             LEFT JOIN clinic_settings cs ON cs.clinic_id = p.clinic_id
             LEFT JOIN users u ON u.id = p.doctor_id
             WHERE p.id = ? AND p.clinic_id = ? AND p.deleted_at IS NULL`,
            [prescriptionId, clinicId],
            async (err, row: any) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (!row) {
                    res.status(404).json({ error: 'Receita não encontrada' });
                    return;
                }

                let identity: any = {};
                if (row.clinic_identity) {
                    try {
                        identity = JSON.parse(row.clinic_identity);
                    } catch {
                        identity = {};
                    }
                }

                let medications: any[] = [];
                if (row.medications_json) {
                    try {
                        medications = JSON.parse(row.medications_json);
                    } catch {
                        medications = [];
                    }
                }

                const clinic = {
                    name: identity.name || row.clinic_name || 'Clínica',
                    address: row.clinic_address_full || identity.address || '',
                    phone: identity.phone || '',
                    logoDataUrl: identity.logo || null,
                    logoUrl: row.clinic_logo_url || null,
                    primaryColor: row.clinic_primary_color || null,
                };

                const doctor = {
                    name: row.doctor_name || 'Médico Responsável',
                    crm: row.doctor_crm || null,
                    crm_state: row.doctor_crm_state || null,
                };

                try {
                    const buffer = await PrescriptionPdfService.generatePdfBuffer(clinic, doctor, {
                        medications,
                    });

                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader(
                        'Content-Disposition',
                        `attachment; filename="receita_${prescriptionId}.pdf"`
                    );
                    res.send(buffer);
                } catch (serviceErr: any) {
                    res.status(500).json({ error: serviceErr.message || 'Erro ao gerar PDF' });
                }
            }
        );
    }
}
