import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  getAddresses,
  createAddress,
  deleteAddress,
} from './address.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAddresses);
router.post('/', createAddress);
router.delete('/:id', deleteAddress);

export const addressRoutes = router;
