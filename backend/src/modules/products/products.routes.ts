import { Router } from 'express';
import { getProducts, getProductBySlug } from './products.controller';

const router = Router();

router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

export const productRoutes = router;
