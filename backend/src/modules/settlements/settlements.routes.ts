import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { getSupplierSettlements, markSettlementPayout } from './settlements.controller';

const router = Router();

router.use(authenticate);

router.get('/', getSupplierSettlements);
router.patch('/:id/payout', markSettlementPayout);

export const settlementRoutes = router;
