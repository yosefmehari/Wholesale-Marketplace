import { Router } from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from './favorites.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Check favorite status (can be called by auth or returns false if unauthenticated)
router.get('/check/:productId', authenticate, checkFavorite);

// Authenticated favorite actions
router.get('/', authenticate, getFavorites);
router.post('/:productId', authenticate, addFavorite);
router.delete('/:productId', authenticate, removeFavorite);

export const favoriteRoutes = router;
