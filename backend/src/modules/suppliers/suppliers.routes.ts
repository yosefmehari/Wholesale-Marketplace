import { Router } from 'express';
import { getSuppliers, getSupplierBySlug } from './suppliers.controller';

const router = Router();

router.get('/', getSuppliers);
router.get('/:slug', getSupplierBySlug);

export const supplierRoutes = router;
