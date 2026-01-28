import Joi from 'joi';

export const createUserSchema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        'string.empty': 'Nome é obrigatório',
        'string.min': 'Nome deve ter no mínimo 2 caracteres'
    }),
    username: Joi.string().alphanum().min(3).max(30).required().messages({
        'string.empty': 'Username é obrigatório',
        'string.alphanum': 'Username deve conter apenas letras e números',
        'string.min': 'Username deve ter no mínimo 3 caracteres'
    }),
    password: Joi.string().min(6).required().messages({
        'string.empty': 'Senha é obrigatória',
        'string.min': 'Senha deve ter no mínimo 6 caracteres'
    }),
    role: Joi.string().valid('admin', 'medico', 'recepcao').required().messages({
        'any.only': 'Role deve ser: admin, medico ou recepcao'
    })
});
