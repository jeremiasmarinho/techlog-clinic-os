import { Request, Response } from 'express';
import { db } from '../database';

export class MetricsController {
    // Dashboard summary metrics
    static async summary(_req: Request, res: Response): Promise<void> {
        try {
            // 1. Taxa de conversão (leads → consultas agendadas)
            const totalLeads = await new Promise<number>((resolve, reject) => {
                db.get("SELECT COUNT(*) as count FROM leads WHERE status != 'archived'", [], (err, row: any) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
            });

            const agendados = await new Promise<number>((resolve, reject) => {
                db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'agendado' OR appointment_date IS NOT NULL", [], (err, row: any) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
            });

            const taxaConversao = totalLeads > 0 ? Math.round((agendados / totalLeads) * 100) : 0;

            // 2. No-shows este mês
            const noShows = await new Promise<number>((resolve, reject) => {
                db.get(`
                    SELECT COUNT(*) as count 
                    FROM leads 
                    WHERE status = 'archived' 
                    AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
                `, [], (err, row: any) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
            });

            // 3. Consultas agendadas esta semana
            const consultasSemana = await new Promise<number>((resolve, reject) => {
                db.get(`
                    SELECT COUNT(*) as count 
                    FROM leads 
                    WHERE appointment_date >= date('now')
                    AND appointment_date <= date('now', '+7 days')
                `, [], (err, row: any) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
            });

            res.json({
                taxaConversao: {
                    value: taxaConversao,
                    total: totalLeads,
                    convertidos: agendados
                },
                noShows: {
                    value: noShows,
                    periodo: 'este mês'
                },
                consultasSemana: {
                    value: consultasSemana,
                    periodo: 'próximos 7 dias'
                }
            });
        } catch (error) {
            console.error('Erro ao buscar métricas:', error);
            res.status(500).json({ error: 'Erro ao buscar métricas' });
        }
    }
}
