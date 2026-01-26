import { Router } from 'express';
import { LeadController } from '../controllers/LeadController';

const router = Router();

// Definição das Rotas
router.post('/', LeadController.create);
router.get('/', LeadController.index);
router.patch('/:id', LeadController.update);
router.delete('/:id', LeadController.delete);

// ATENÇÃO: Exportação Default (É isso que o server.ts espera)
export default router;