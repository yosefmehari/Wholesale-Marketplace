import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  checkout,
  getBuyerOrders,
  getOrderDetails,
  cancelOrder,
  updateOrderStatus,
  getSupplierOrders,
} from './orders.controller';

const router = Router();

router.use(authenticate);

router.post('/checkout', checkout);
router.get('/', getBuyerOrders);
router.get('/supplier/list', getSupplierOrders);
router.get('/:id', getOrderDetails);
router.patch('/:id/cancel', cancelOrder);
router.patch('/:id/status', updateOrderStatus);

export const orderRoutes = router;
