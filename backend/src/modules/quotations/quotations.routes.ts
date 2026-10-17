import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  createRfq,
  getRfqs,
  getRfqDetails,
  submitSupplierQuote,
  requestRevision,
  declineRfq,
  acceptQuotation,
} from './quotations.controller';

const router = Router();

router.use(authenticate);

router.post('/rfq', createRfq);
router.get('/rfqs', getRfqs);
router.get('/rfqs/:id', getRfqDetails);
router.post('/rfqs/:id/quote', submitSupplierQuote);
router.post('/rfqs/:id/request-revision', requestRevision);
router.post('/rfqs/:id/decline', declineRfq);
router.post('/rfqs/:id/accept', acceptQuotation);

export const quotationRoutes = router;
