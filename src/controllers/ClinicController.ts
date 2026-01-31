import { Request, Response } from 'express';
import { db } from '../database';

export class ClinicController {
    
    /**
     * Get Clinic Settings (GET /api/clinic/settings)
     * Returns settings for the authenticated user's clinic
     */
    static getSettings(req: Request, res: Response): void {
        const clinicId = req.clinicId || 1; // From JWT token
        
        db.get(
            "SELECT * FROM clinic_settings WHERE clinic_id = ?",
            [clinicId],
            (err, row: any) => {
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
                            logo: null
                        },
                        hours: {
                            opening: '08:00',
                            closing: '18:00',
                            lunchStart: '',
                            lunchEnd: '',
                            workingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
                        },
                        insurancePlans: [],
                        chatbot: {
                            greeting: '',
                            awayMessage: '',
                            instructions: ''
                        }
                    });
                    return;
                }
                
                // Parse JSON fields
                try {
                    const settings = {
                        identity: JSON.parse(row.identity),
                        hours: JSON.parse(row.hours),
                        insurancePlans: JSON.parse(row.insurance_plans),
                        chatbot: JSON.parse(row.chatbot)
                    };
                    
                    console.log(`✅ Configurações retornadas para clinic_id=${clinicId}`);
                    res.json(settings);
                } catch (parseError) {
                    console.error('❌ Erro ao parsear JSON:', parseError);
                    res.status(500).json({ error: 'Erro ao processar configurações' });
                }
            }
        );
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
                error: 'Campos obrigatórios: identity, hours, insurancePlans, chatbot' 
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
            "SELECT id FROM clinic_settings WHERE clinic_id = ?",
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
                        function(updateErr) {
                            if (updateErr) {
                                console.error('❌ Erro ao atualizar configurações:', updateErr.message);
                                res.status(500).json({ error: updateErr.message });
                                return;
                            }
                            
                            console.log(`✅ Configurações atualizadas para clinic_id=${clinicId}`);
                            res.json({ 
                                message: 'Configurações atualizadas com sucesso',
                                clinicId
                            });
                        }
                    );
                } else {
                    // Insert new settings
                    db.run(
                        `INSERT INTO clinic_settings (clinic_id, identity, hours, insurance_plans, chatbot)
                         VALUES (?, ?, ?, ?, ?)`,
                        [clinicId, identityJson, hoursJson, insurancePlansJson, chatbotJson],
                        function(insertErr) {
                            if (insertErr) {
                                console.error('❌ Erro ao criar configurações:', insertErr.message);
                                res.status(500).json({ error: insertErr.message });
                                return;
                            }
                            
                            console.log(`✅ Configurações criadas para clinic_id=${clinicId}`);
                            res.status(201).json({ 
                                message: 'Configurações criadas com sucesso',
                                clinicId,
                                id: this.lastID
                            });
                        }
                    );
                }
            }
        );
    }
}
