import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  initiatePayment,
  submitPaymentProof,
  verifyPayment,
  getOrderPayments,
  telebirrWebhook,
} from './payments.controller';

const router = Router();

// Public webhook route
router.post('/telebirr/webhook', telebirrWebhook);

// Authenticated routes
router.use(authenticate);

router.post('/initiate', initiatePayment);
router.post('/submit-proof', submitPaymentProof);
router.post('/:id/verify', verifyPayment);
router.get('/order/:orderId', getOrderPayments);

export const paymentRoutes = router;
