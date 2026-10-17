import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { getInvoiceByOrder } from './invoices.controller';

const router = Router();

router.use(authenticate);
router.get('/:orderId', getInvoiceByOrder);

export const invoiceRoutes = router;
