const express = require('express');
const multer = require('multer');
const {
  viewDeck,
  filterDeckCards,
  addCardToDeck,
  createDeck,
  removeCardFromDeck,
  verifyDeck,
  searchDeck,
  deleteDeck,
  uploadDeckPicture,
  removeDeckPicture,
} = require('../controllers/deckController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
// Define upload with proper configuration
const upload = multer({ storage: multer.memoryStorage() });

// All deck routes require authentication
router.use(authenticate);

// Get deck by ID
router.get('/:deckId', viewDeck);

// Filter deck cards
router.get('/:deckId/filter', filterDeckCards);

// Add card to deck
router.post('/add_card', addCardToDeck);

// Create a new deck
router.post('/create', createDeck);

// Remove card from deck
router.delete('/:deckId/remove_card', removeCardFromDeck);

// Verify if deck has at least 5 cards
router.get('/:deckId/verify', verifyDeck);

// Search for cards in deck
router.get('/:deckId/search', searchDeck);

// Delete a deck
router.delete('/delete', deleteDeck);

// Upload deck picture
router.post(
  '/:deckId/upload_picture',
  upload.single('deckPicture'),
  uploadDeckPicture
);

// Remove deck picture
router.delete('/:deckId/remove_picture', removeDeckPicture);

module.exports = router;
