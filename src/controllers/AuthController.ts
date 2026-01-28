import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthController {
    static async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;
        
        // Validação básica
        if (!email || !password) {
            res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
            return;
        }
        
        // Verificação com bcrypt
        // IMPORTANTE: ADMIN_PASS deve conter o hash bcrypt da senha, não a senha em texto plano
        if (email === process.env.ADMIN_USER) {
            const isValid = await bcrypt.compare(password, process.env.ADMIN_PASS || '');
            
            if (isValid) {
                const token = jwt.sign(
                    { id: 1, name: 'Administrador', email }, 
                    process.env.JWT_SECRET as string, 
                    { expiresIn: '8h' }
                );
                
                res.json({
                    user: { name: 'Administrador', email },
                    token,
                });
                return;
            }
        }
        
        res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }
}
