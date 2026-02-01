import { Router } from 'express';
import { FinancialController } from '../controllers/FinancialController';
import { tenantGuard } from '../middleware/tenant.middleware';
import { auditLogger } from '../middleware/audit.middleware';

const router = Router();

router.get('/dashboard', tenantGuard, auditLogger, FinancialController.dashboard);
router.get('/report', tenantGuard, auditLogger, FinancialController.getFinancialReport);
router.get('/transactions', tenantGuard, auditLogger, FinancialController.listTransactions);
router.get('/transactions/:id', tenantGuard, auditLogger, FinancialController.getTransaction);
router.post('/transactions', tenantGuard, auditLogger, FinancialController.createTransaction);
router.patch('/transactions/:id', tenantGuard, auditLogger, FinancialController.updateTransaction);
router.delete('/transactions/:id', tenantGuard, auditLogger, FinancialController.deleteTransaction);

export default router;
