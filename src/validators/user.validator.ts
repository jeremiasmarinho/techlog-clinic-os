import { z } from 'zod';

// Schema para criação de usuário
export const createUserSchema = z.object({
    name: z.string({ message: 'Nome é obrigatório e deve ser um texto' })
    .min(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' })
    .trim(),
    
    username: z.string({ message: 'Username é obrigatório e deve ser um texto' })
    .min(3, { message: 'Username deve ter no mínimo 3 caracteres' })
    .max(30, { message: 'Username deve ter no máximo 30 caracteres' })
    .regex(/^[a-zA-Z0-9]+$/, { message: 'Username deve conter apenas letras e números' })
    .trim()
    .toLowerCase(),
    
    password: z.string({ message: 'Senha é obrigatória e deve ser um texto' })
    .min(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
    .max(100, { message: 'Senha deve ter no máximo 100 caracteres' }),
    
    role: z.enum(['admin', 'medico', 'recepcao'], { message: 'Role deve ser: admin, medico ou recepcao' })
});

// Types inferidos dos schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;

