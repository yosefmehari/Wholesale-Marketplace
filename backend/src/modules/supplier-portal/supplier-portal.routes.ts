import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  getSupplierDashboard,
  getSupplierProducts,
  createSupplierProduct,
  updateSupplierProduct,
  getSupplierInventory,
  updateSupplierStock,
  submitVerification,
  getVerificationStatus,
} from './supplier-portal.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

// Enforce supplier authentication for all routes
router.use(authenticate, requireRole([UserRole.SUPPLIER, UserRole.ADMIN]));

router.get('/dashboard', getSupplierDashboard);
router.get('/products', getSupplierProducts);
router.post('/products', createSupplierProduct);
router.put('/products/:id', updateSupplierProduct);
router.get('/inventory', getSupplierInventory);
router.patch('/inventory/:productId', updateSupplierStock);
router.post('/verification', submitVerification);
router.get('/verification', getVerificationStatus);

export const supplierPortalRoutes = router;
