const express = require('express');
const { 
  getSearchFilters, 
  searchCards, 
  getPaginatedResults, 
  getCardById, 
  addCardToInventory, 
  addCardToWishlist // Importing the missing function
} = require('../controllers/cardController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/search/filters', getSearchFilters);
router.get('/search', searchCards);
router.get('/search/page/:page', getPaginatedResults);
router.get('/cards/:cardId', getCardById);

// Protected routes
router.post('/add_card_to_inventory', authenticate, addCardToInventory);
router.post('/add_card_to_wishlist', authenticate, addCardToWishlist); // Adding the missing route

module.exports = router;