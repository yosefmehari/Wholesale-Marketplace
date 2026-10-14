import { Router } from 'express';
import {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
} from './business.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createBusiness);
router.get('/me', authenticate, getMyBusinesses);
router.get('/:id', getBusinessById);
router.patch('/:id', authenticate, updateBusiness);

export const businessRoutes = router;
