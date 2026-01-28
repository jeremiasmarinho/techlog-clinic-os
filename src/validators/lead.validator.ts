import Joi from 'joi';

export const createLeadSchema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        'string.empty': 'Nome é obrigatório',
        'string.min': 'Nome deve ter no mínimo 2 caracteres',
        'string.max': 'Nome deve ter no máximo 100 caracteres'
    }),
    phone: Joi.string().pattern(/^\d{10,11}$/).required().messages({
        'string.empty': 'Telefone é obrigatório',
        'string.pattern.base': 'Telefone deve ter 10 ou 11 dígitos'
    }),
    type: Joi.string().valid('primeira_consulta', 'retorno', 'recorrente', 'exame', 'Consulta', 'Exame', 'geral').optional(),
    status: Joi.string().valid('novo', 'em_atendimento', 'agendado', 'finalizado', 'archived').optional()
});

export const updateLeadSchema = Joi.object({
    status: Joi.string().valid('novo', 'em_atendimento', 'agendado', 'finalizado', 'archived').optional(),
    appointment_date: Joi.date().iso().allow(null).optional(),
    doctor: Joi.string().max(100).allow(null, '').optional(),
    notes: Joi.string().max(1000).allow(null, '').optional(),
    type: Joi.string().valid('primeira_consulta', 'retorno', 'recorrente', 'exame', 'Consulta', 'Exame', 'geral').optional()
}).min(1);
