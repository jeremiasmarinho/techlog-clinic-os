import { z } from 'zod';

// Schema para criação de lead
export const createLeadSchema = z.object({
    name: z
        .string({ message: 'Nome deve ser um texto' })
        .min(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
        .max(100, { message: 'Nome deve ter no máximo 100 caracteres' })
        .trim(),

    phone: z
        .string({ message: 'Telefone deve ser um texto' })
        .regex(/^\d{10,11}$/, { message: 'Telefone deve conter 10 ou 11 dígitos numéricos' })
        .min(10, { message: 'Telefone deve conter no mínimo 10 dígitos' })
        .max(11, { message: 'Telefone deve conter no máximo 11 dígitos' }),

    type: z.string().max(500, 'Tipo deve ter no máximo 500 caracteres').optional().default('geral'),

    status: z
        .enum(['novo', 'em_atendimento', 'agendado', 'finalizado', 'confirmed', 'archived'])
        .optional()
        .default('novo'),
});

// Schema para atualização de lead
export const updateLeadSchema = z
    .object({
        status: z
            .enum(['novo', 'em_atendimento', 'agendado', 'finalizado', 'confirmed', 'archived'])
            .optional(),

        appointment_date: z.string().datetime().nullable().optional().or(z.null()),

        doctor: z
            .string()
            .max(100, 'Nome do médico deve ter no máximo 100 caracteres')
            .nullable()
            .optional(),

        notes: z
            .string()
            .max(1000, 'Notas devem ter no máximo 1000 caracteres')
            .nullable()
            .optional(),

        type: z.string().max(500, 'Tipo deve ter no máximo 500 caracteres').optional(),

        attendance_status: z
            .enum(['compareceu', 'nao_compareceu', 'cancelado', 'remarcado'])
            .optional(),

        archive_reason: z
            .enum(['tratamento_concluido', 'nao_respondeu', 'desistiu', 'outro'])
            .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Pelo menos um campo deve ser fornecido para atualização',
    });

// Types inferidos dos schemas
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
