import { Request, Response } from 'express';
import { db } from '../database';

export class ClinicController {
    /**
     * Get Clinic Settings (GET /api/clinic/settings)
     * Returns settings for the authenticated user's clinic
     */
    static getSettings(req: Request, res: Response): void {
        const clinicId = req.clinicId || 1; // From JWT token

        db.get('SELECT * FROM clinic_settings WHERE clinic_id = ?', [clinicId], (err, row: any) => {
            if (err) {
                console.error('❌ Erro ao buscar configurações:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }

            if (!row) {
                // Return default settings if none exist
                res.json({
                    identity: {
                        name: '',
                        phone: '',
                        address: '',
                        primaryColor: '#06b6d4',
                        logo: null,
                    },
                    hours: {
                        opening: '08:00',
                        closing: '18:00',
                        lunchStart: '',
                        lunchEnd: '',
                        workingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
                    },
                    insurancePlans: [],
                    chatbot: {
                        greeting: '',
                        awayMessage: '',
                        instructions: '',
                    },
                });
                return;
            }

            // Parse JSON fields
            try {
                const settings = {
                    identity: JSON.parse(row.identity),
                    hours: JSON.parse(row.hours),
                    insurancePlans: JSON.parse(row.insurance_plans),
                    chatbot: JSON.parse(row.chatbot),
                };

                console.log(`✅ Configurações retornadas para clinic_id=${clinicId}`);
                res.json(settings);
            } catch (parseError) {
                console.error('❌ Erro ao parsear JSON:', parseError);
                res.status(500).json({ error: 'Erro ao processar configurações' });
            }
        });
    }

    /**
     * Update Clinic Settings (PUT /api/clinic/settings)
     * Updates or creates settings for the authenticated user's clinic
     */
    static updateSettings(req: Request, res: Response): void {
        const clinicId = req.clinicId || 1; // From JWT token
        const { identity, hours, insurancePlans, chatbot } = req.body;

        // Validate required fields
        if (!identity || !hours || !insurancePlans || !chatbot) {
            res.status(400).json({
                error: 'Campos obrigatórios: identity, hours, insurancePlans, chatbot',
            });
            return;
        }

        // Convert to JSON strings
        const identityJson = JSON.stringify(identity);
        const hoursJson = JSON.stringify(hours);
        const insurancePlansJson = JSON.stringify(insurancePlans);
        const chatbotJson = JSON.stringify(chatbot);

        // Check if settings already exist
        db.get(
            'SELECT id FROM clinic_settings WHERE clinic_id = ?',
            [clinicId],
            (err, row: any) => {
                if (err) {
                    console.error('❌ Erro ao verificar configurações:', err.message);
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (row) {
                    // Update existing settings
                    db.run(
                        `UPDATE clinic_settings 
                         SET identity = ?, hours = ?, insurance_plans = ?, chatbot = ?, updated_at = CURRENT_TIMESTAMP
                         WHERE clinic_id = ?`,
                        [identityJson, hoursJson, insurancePlansJson, chatbotJson, clinicId],
                        function (updateErr) {
                            if (updateErr) {
                                console.error(
                                    '❌ Erro ao atualizar configurações:',
                                    updateErr.message
                                );
                                res.status(500).json({ error: updateErr.message });
                                return;
                            }

                            console.log(`✅ Configurações atualizadas para clinic_id=${clinicId}`);
                            res.json({
                                message: 'Configurações atualizadas com sucesso',
                                clinicId,
                            });
                        }
                    );
                } else {
                    // Insert new settings
                    db.run(
                        `INSERT INTO clinic_settings (clinic_id, identity, hours, insurance_plans, chatbot)
                         VALUES (?, ?, ?, ?, ?)`,
                        [clinicId, identityJson, hoursJson, insurancePlansJson, chatbotJson],
                        function (insertErr) {
                            if (insertErr) {
                                console.error('❌ Erro ao criar configurações:', insertErr.message);
                                res.status(500).json({ error: insertErr.message });
                                return;
                            }

                            console.log(`✅ Configurações criadas para clinic_id=${clinicId}`);
                            res.status(201).json({
                                message: 'Configurações criadas com sucesso',
                                clinicId,
                                id: this.lastID,
                            });
                        }
                    );
                }
            }
        );
    }

    /**
     * PATCH /api/clinic/settings (multipart/form-data)
     * Atualiza identidade visual da clínica
     */
    static updateIdentitySettings(req: Request, res: Response): void {
        const clinicId = req.clinicId || 1;
        const { name, primaryColor, address } = req.body || {};
        const logoFile = (req as Request & { file?: Express.Multer.File }).file;

        const logoUrl = logoFile ? `/uploads/logos/${logoFile.filename}` : null;

        db.get(
            `SELECT id, name, logo_url, primary_color, address_full FROM clinics WHERE id = ?`,
            [clinicId],
            (clinicErr, clinicRow: any) => {
                if (clinicErr) {
                    res.status(500).json({ error: clinicErr.message });
                    return;
                }

                const updatedName = name || clinicRow?.name || '';
                const updatedColor = primaryColor || clinicRow?.primary_color || '#06b6d4';
                const updatedAddress = address || clinicRow?.address_full || '';
                const updatedLogo = logoUrl || clinicRow?.logo_url || null;

                db.run(
                    `UPDATE clinics
                     SET name = ?, logo_url = ?, primary_color = ?, address_full = ?, updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [updatedName, updatedLogo, updatedColor, updatedAddress, clinicId],
                    (updateErr) => {
                        if (updateErr) {
                            res.status(500).json({ error: updateErr.message });
                            return;
                        }

                        db.get(
                            `SELECT identity, hours, insurance_plans, chatbot
                             FROM clinic_settings WHERE clinic_id = ?`,
                            [clinicId],
                            (settingsErr, settingsRow: any) => {
                                if (settingsErr) {
                                    res.status(500).json({ error: settingsErr.message });
                                    return;
                                }

                                const defaultHours = {
                                    opening: '08:00',
                                    closing: '18:00',
                                    lunchStart: '',
                                    lunchEnd: '',
                                    workingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
                                };
                                const defaultChatbot = {
                                    greeting: '',
                                    awayMessage: '',
                                    instructions: '',
                                };

                                const currentIdentity = settingsRow?.identity
                                    ? JSON.parse(settingsRow.identity)
                                    : {
                                          name: '',
                                          phone: '',
                                          address: '',
                                          primaryColor: '#06b6d4',
                                          logo: null,
                                      };

                                const nextIdentity = {
                                    ...currentIdentity,
                                    name: updatedName,
                                    address: updatedAddress,
                                    primaryColor: updatedColor,
                                    logo: updatedLogo,
                                };

                                if (settingsRow) {
                                    db.run(
                                        `UPDATE clinic_settings
                                         SET identity = ?, updated_at = CURRENT_TIMESTAMP
                                         WHERE clinic_id = ?`,
                                        [JSON.stringify(nextIdentity), clinicId],
                                        (identityErr) => {
                                            if (identityErr) {
                                                res.status(500).json({
                                                    error: identityErr.message,
                                                });
                                                return;
                                            }

                                            res.json({
                                                message: 'Identidade visual atualizada',
                                                clinicId,
                                                logo_url: updatedLogo,
                                                name: updatedName,
                                                primary_color: updatedColor,
                                                address_full: updatedAddress,
                                            });
                                        }
                                    );
                                } else {
                                    db.run(
                                        `INSERT INTO clinic_settings (clinic_id, identity, hours, insurance_plans, chatbot)
                                         VALUES (?, ?, ?, ?, ?)`,
                                        [
                                            clinicId,
                                            JSON.stringify(nextIdentity),
                                            JSON.stringify(defaultHours),
                                            JSON.stringify([]),
                                            JSON.stringify(defaultChatbot),
                                        ],
                                        (insertErr) => {
                                            if (insertErr) {
                                                res.status(500).json({ error: insertErr.message });
                                                return;
                                            }

                                            res.status(201).json({
                                                message: 'Identidade visual atualizada',
                                                clinicId,
                                                logo_url: updatedLogo,
                                                name: updatedName,
                                                primary_color: updatedColor,
                                                address_full: updatedAddress,
                                            });
                                        }
                                    );
                                }
                            }
                        );
                    }
                );
            }
        );
    }
}
