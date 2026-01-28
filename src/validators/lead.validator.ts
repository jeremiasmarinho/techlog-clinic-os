import { z } from 'zod';

// Schema para criação de lead
export const createLeadSchema = z.object({
    name: z.string({ message: 'Nome é obrigatório e deve ser um texto' })
    .min(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' })
    .trim(),
    
    phone: z.string({ message: 'Telefone é obrigatório e deve ser um texto' })
    .regex(/^\d{11}$/, { message: 'Telefone deve conter exatamente 11 dígitos numéricos' }),
    
    type: z.enum(['primeira_consulta', 'retorno', 'recorrente', 'exame', 'Consulta', 'Exame', 'geral'], { message: 'Tipo inválido' })
        .optional()
        .default('geral'),
    
    status: z.enum(['novo', 'em_atendimento', 'agendado', 'finalizado', 'archived'], { message: 'Status inválido' })
        .optional()
        .default('novo')
});

// Schema para atualização de lead
export const updateLeadSchema = z.object({
    status: z.enum(['novo', 'em_atendimento', 'agendado', 'finalizado', 'archived'], { message: 'Status inválido' }).optional(),
    
    appointment_date: z.string().datetime().optional().nullable(),
    
    doctor: z.string()
        .max(100, { message: 'Nome do médico deve ter no máximo 100 caracteres' })
        .nullable()
        .optional(),
    
    notes: z.string()
        .max(1000, { message: 'Notas devem ter no máximo 1000 caracteres' })
        .nullable()
        .optional(),
    
    type: z.enum(['primeira_consulta', 'retorno', 'recorrente', 'exame', 'Consulta', 'Exame', 'geral'], { message: 'Tipo inválido' })
        .optional(),
    
    attendance_status: z.enum(['compareceu', 'nao_compareceu', 'cancelado', 'remarcado'], { message: 'Status de atendimento inválido' })
        .optional(),
    
    archive_reason: z.enum(['tratamento_concluido', 'nao_respondeu', 'desistiu', 'outro'], { message: 'Motivo de arquivamento inválido' })
        .optional()
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Pelo menos um campo deve ser fornecido para atualização' }
);

// Types inferidos dos schemas
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

