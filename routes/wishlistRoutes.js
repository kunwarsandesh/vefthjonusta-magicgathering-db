// wishlistRoutes.js
const express = require('express');
const { getWishlist, addCardToWishlist, removeCardFromWishlist } = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Protected routes for wishlist
router.get('/', authenticate, getWishlist);
router.post('/add_card', authenticate, addCardToWishlist);
router.delete('/remove_card', authenticate, removeCardFromWishlist);

module.exports = router;
