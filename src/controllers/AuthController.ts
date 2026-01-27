import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export class AuthController {
    static async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;
        
        console.log(`🔐 Tentativa de login: ${email}`);
        console.log(`📧 ENV ADMIN_USER: ${process.env.ADMIN_USER}`);
        console.log(`🔑 ENV ADMIN_PASS: ${process.env.ADMIN_PASS ? 'definido' : 'undefined'}`);
        console.log(`✉️  Email match: ${email === process.env.ADMIN_USER}`);
        console.log(`🔒 Password match: ${password === process.env.ADMIN_PASS}`);
        
        // Simulação de verificação (Em produção usaríamos banco + bcrypt)
        if (email === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
            const token = jwt.sign(
                { id: 1, name: 'Administrador', email }, 
                process.env.JWT_SECRET as string, 
                { expiresIn: '8h' }
            );
            
            console.log(`✅ Login bem-sucedido: ${email}`);
            res.json({
                user: { name: 'Administrador', email },
                token,
            });
            return;
        }
        
        console.log(`❌ Credenciais inválidas: ${email}`);
        res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }
}
