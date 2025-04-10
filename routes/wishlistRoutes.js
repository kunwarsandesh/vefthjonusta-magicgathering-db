const express = require('express');
const { addCardToWishlist } = require('../controllers/cardController'); // Ensure this import is correct
const { getWishlist, removeCardFromWishlist } = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getWishlist);
router.post('/add_card', authenticate, addCardToWishlist);
router.delete('/remove_card', authenticate, removeCardFromWishlist);

module.exports = router;

