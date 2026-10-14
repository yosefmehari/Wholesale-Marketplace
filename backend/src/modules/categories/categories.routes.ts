import { Router } from 'express';
import { getCategories, getCategoryBySlug } from './categories.controller';

const router = Router();

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

export const categoryRoutes = router;
