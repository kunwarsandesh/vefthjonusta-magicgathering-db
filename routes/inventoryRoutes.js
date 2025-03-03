const express = require('express');
const {
  getInventory,
  searchInventory,
  updateCardQuantity,
  removeCard,
  getSortedInventory,
} = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All inventory routes require authentication
router.use(authenticate);

// Get user's inventory
router.get('/', getInventory);

// Get sorted inventory
router.get('/sorted', getSortedInventory);

// Search inventory
router.get('/search', searchInventory);

// Update card quantity
router.put('/update_quantity', updateCardQuantity);

// Remove card from inventory
router.delete('/remove_card', removeCard);

module.exports = router;
