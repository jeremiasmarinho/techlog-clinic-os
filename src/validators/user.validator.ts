import { z } from 'zod';

// Schema para criação de usuário
export const createUserSchema = z.object({
    name: z.string({
        required_error: 'Nome é obrigatório',
        invalid_type_error: 'Nome deve ser um texto'
    })
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
    
    username: z.string({
        required_error: 'Username é obrigatório',
        invalid_type_error: 'Username deve ser um texto'
    })
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9]+$/, 'Username deve conter apenas letras e números')
    .trim()
    .toLowerCase(),
    
    password: z.string({
        required_error: 'Senha é obrigatória',
        invalid_type_error: 'Senha deve ser um texto'
    })
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
    
    role: z.enum(['admin', 'medico', 'recepcao'], {
        required_error: 'Role é obrigatório',
        invalid_type_error: 'Role deve ser: admin, medico ou recepcao'
    })
});

// Types inferidos dos schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;

