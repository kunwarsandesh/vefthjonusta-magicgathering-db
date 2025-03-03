const express = require('express');
const userRoutes = require('./userRoutes');
const cardRoutes = require('./cardRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const deckRoutes = require('./deckRoutes');

const router = express.Router();

// Mount route groups
router.use('/users', userRoutes);
router.use('/cards', cardRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/decks', deckRoutes);

module.exports = router;