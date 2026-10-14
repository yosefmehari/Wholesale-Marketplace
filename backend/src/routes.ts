import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { healthRoutes } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { businessRoutes } from './modules/businesses/business.routes';
import { categoryRoutes } from './modules/categories/categories.routes';
import { productRoutes } from './modules/products/products.routes';
import { supplierRoutes } from './modules/suppliers/suppliers.routes';
import { supplierPortalRoutes } from './modules/supplier-portal/supplier-portal.routes';
import { authenticate, requireRole } from './middleware/auth.middleware';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/businesses', businessRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/supplier', supplierPortalRoutes);

// Protected admin test endpoint for authorization verification
router.get('/admin/test', authenticate, requireRole([UserRole.ADMIN]), (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Admin authorization granted',
      user: req.user,
    },
  });
});

export const apiV1Routes = router;
