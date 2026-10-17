import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
} from './cart.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/items', addItem);
router.patch('/items/:itemId', updateItemQuantity);
router.delete('/items/:itemId', removeItem);
router.delete('/', clearCart);

export const cartRoutes = router;
