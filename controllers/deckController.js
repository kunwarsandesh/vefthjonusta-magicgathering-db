const { pool } = require('../models/db');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// View a specific deck
const viewDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.id;

    // Get deck information
    const [deckRows] = await pool.execute(
      'SELECT * FROM decks WHERE id = ? AND user_id = ?',
      [deckId, userId]
    );

    if (deckRows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const deck = deckRows[0];

    // Get cards in the deck
    const [deckCardRows] = await pool.execute(
      `SELECT dc.*, c.name, c.mana_cost, c.type_line, c.oracle_text, c.usd, c.usd_foil, c.image_url, c.set_name 
       FROM deck_cards dc
       JOIN cards c ON dc.card_id = c.id
       WHERE dc.deck_id = ?`,
      [deckId]
    );

    // Format deck cards
    const deckCards = deckCardRows.map((row) => ({
      id: row.id,
      cardId: row.card_id,
      count: row.count,
      card: {
        id: row.card_id,
        name: row.name,
        manaCost: row.mana_cost,
        typeLine: row.type_line,
        oracleText: row.oracle_text,
        usd: row.usd,
        usdFoil: row.usd_foil,
        imageUrl: row.image_url,
        setName: row.set_name,
      },
    }));

    // Convert picture to base64 if available
    let base64Picture = null;
    if (deck.picture) {
      base64Picture = deck.picture.toString('base64');
    }

    return res.json({
      deck: {
        id: deck.id,
        name: deck.name,
        userId: deck.user_id,
        picture: base64Picture,
        deckCards: deckCards,
      },
    });
  } catch (error) {
    console.error('Error viewing deck:', error.message);
    return res.status(500).json({ error: 'Error retrieving deck information' });
  }
};

// Filter deck cards by color and type
const filterDeckCards = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { color, type } = req.query;
    const userId = req.user.id;

    // Verify deck belongs to user
    const [deckRows] = await pool.execute(
      'SELECT * FROM decks WHERE id = ? AND user_id = ?',
      [deckId, userId]
    );

    if (deckRows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Build query to filter cards
    let query = `
      SELECT dc.*, c.name, c.mana_cost, c.type_line, c.oracle_text, c.usd, c.usd_foil, c.image_url, c.set_name 
      FROM deck_cards dc
      JOIN cards c ON dc.card_id = c.id
      WHERE dc.deck_id = ?
    `;

    const params = [deckId];

    if (color) {
      query += ' AND c.mana_cost LIKE ?';
      params.push(`%${color}%`);
    }

    if (type) {
      query += ' AND c.type_line LIKE ?';
      params.push(`%${type}%`);
    }

    const [deckCardRows] = await pool.execute(query, params);

    // Format deck cards
    const filteredCards = deckCardRows.map((row) => ({
      id: row.id,
      cardId: row.card_id,
      count: row.count,
      card: {
        id: row.card_id,
        name: row.name,
        manaCost: row.mana_cost,
        typeLine: row.type_line,
        oracleText: row.oracle_text,
        usd: row.usd,
        usdFoil: row.usd_foil,
        imageUrl: row.image_url,
        setName: row.set_name,
      },
    }));

    return res.json({ deckCards: filteredCards });
  } catch (error) {
    console.error('Error filtering deck cards:', error.message);
    return res.status(500).json({ error: 'Error filtering deck cards' });
  }
};

// Add a card to a deck (increment count if it exists)
const addCardToDeckHelper = async (deckId, cardId) => {
  // Check if card already exists in deck
  const [existingCardRows] = await pool.execute(
    'SELECT * FROM deck_cards WHERE deck_id = ? AND card_id = ?',
    [deckId, cardId]
  );

  if (existingCardRows.length > 0) {
    // Increment count if card already exists in deck
    await pool.execute(
      'UPDATE deck_cards SET count = count + 1 WHERE deck_id = ? AND card_id = ?',
      [deckId, cardId]
    );
    return { added: true, isNew: false };
  } else {
    // Add new card to deck
    await pool.execute(
      'INSERT INTO deck_cards (deck_id, card_id, count) VALUES (?, ?, 1)',
      [deckId, cardId]
    );
    return { added: true, isNew: true };
  }
};

// Add a card to a deck
const addCardToDeck = async (req, res) => {
  try {
    const { cardId, deckId } = req.body;
    const userId = req.user.id;

    if (!cardId || !deckId) {
      return res
        .status(400)
        .json({ error: 'Card ID and Deck ID are required' });
    }

    // Verify deck belongs to user
    const [deckRows] = await pool.execute(
      'SELECT * FROM decks WHERE id = ? AND user_id = ?',
      [deckId, userId]
    );

    if (deckRows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Check if card exists
    const [cardRows] = await pool.execute('SELECT * FROM cards WHERE id = ?', [
      cardId,
    ]);

    if (cardRows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Add card to deck using helper function
    const result = await addCardToDeckHelper(deckId, cardId);

    return res.status(201).json({
      message: 'Card added to deck successfully',
      card: cardRows[0],
      isNewAddition: result.isNew,
    });
  } catch (error) {
    console.error('Error adding card to deck:', error.message);
    return res.status(500).json({ error: 'Error adding card to deck' });
  }
};

// Remove a card from a deck (decrement count if more than 1)
const removeCardFromDeckHelper = async (deckId, cardId) => {
  // Check card count in deck
  const [countResult] = await pool.execute(
    'SELECT count FROM deck_cards WHERE deck_id = ? AND card_id = ?',
    [deckId, cardId]
  );

  if (countResult.length === 0) {
    return { removed: false, reason: 'Card not found in deck' };
  }

  const count = countResult[0].count;

  if (count > 1) {
    // Decrement count if more than 1
    await pool.execute(
      'UPDATE deck_cards SET count = count - 1 WHERE deck_id = ? AND card_id = ?',
      [deckId, cardId]
    );
    return { removed: true, isRemoved: false };
  } else {
    // Remove card from deck
    await pool.execute(
      'DELETE FROM deck_cards WHERE deck_id = ? AND card_id = ?',
      [deckId, cardId]
    );
    return { removed: true, isRemoved: true };
  }
};

// Create a new deck
const createDeck = async (req, res) => {
  try {
    const { name = 'New Deck' } = req.body;
    const userId = req.user.id;

    // Create new deck
    const [result] = await pool.execute(
      'INSERT INTO decks (name, user_id, created_at) VALUES (?, ?, NOW())',
      [name, userId]
    );

    const deckId = result.insertId;

    return res.status(201).json({
      message: 'Deck created successfully',
      deck: {
        id: deckId,
        name,
        userId,
      },
    });
  } catch (error) {
    console.error('Error creating deck:', error.message);
    return res.status(500).json({ error: 'Error creating deck' });
  }
};

// Remove a card from a deck
const removeCardFromDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { cardId } = req.body;
    const userId = req.user.id;

    if (!cardId) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    // Verify deck belongs to user
    const [deckRows] = await pool.execute(
      'SELECT * FROM decks WHERE id = ? AND user_id = ?',
      [deckId, userId]
    );

    if (deckRows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Remove card from deck using helper function
    const result = await removeCardFromDeckHelper(deckId, cardId);

    if (!result.removed) {
      return res.status(404).json({ error: result.reason });
    }

    return res.json({
      message: 'Card updated in deck successfully',
      completelyRemoved: result.isRemoved,
    });
  } catch (error) {
    console.error('Error removing card from deck:', error.message);
    return res.status(500).json({ error: 'Error removing card from deck' });
  }
};

// Verify if a deck has at least 5 cards
const verifyDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.id;

    // Verify deck belongs to user
    const [deckRows] = await pool.execute(
      'SELECT * FROM decks WHERE id = ? AND user_id = ?',
      [deckId, userId]
    );

    if (deckRows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Count total cards in deck
    const [countResult] = await pool.execute(
      'SELECT SUM(count) as total FROM deck_cards WHERE deck_id = ?',
      [deckId]
    );

    const totalCards = countResult[0].total || 0;
    const isValid = totalCards >= 5;

    return res.json({
      isValid,
      totalCards,
      message: isValid
        ? 'Deck is valid. It has at least 5 cards.'
        : 'Deck is invalid. It must have at least 5 cards.',
    });
  } catch (error) {
    console.error('Error verifying deck:', error.message);
    return res.status(500).json({ error: 'Error verifying deck' });
  }
};

// Search for cards within a deck
const searchDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { query, color, type, isLegendary, isLand } = req.query;
    const userId = req.user.id;

    // Verify deck belongs to user
    const [deckRows] = await pool.execute(
      'SELECT * FROM decks WHERE id = ? AND user_id = ?',
      [deckId, userId]
    );

    if (deckRows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Build query to search cards in deck
    let sqlQuery = `
      SELECT dc.*, c.name, c.mana_cost, c.type_line, c.oracle_text, c.usd, c.usd_foil, c.image_url, c.set_name 
      FROM deck_cards dc
      JOIN cards c ON dc.card_id = c.id
      WHERE dc.deck_id = ?
    `;

    const params = [deckId];

    if (query) {
      sqlQuery += ' AND c.name LIKE ?';
      params.push(`%${query}%`);
    }

    if (color) {
      sqlQuery += ' AND c.mana_cost LIKE ?';
      params.push(`%${color}%`);
    }

    if (type) {
      sqlQuery += ' AND c.type_line LIKE ?';
      params.push(`%${type}%`);
    }

    if (isLegendary === 'true') {
      sqlQuery += ' AND c.type_line LIKE ?';
      params.push('%Legendary%');
    }

    if (isLand === 'true') {
      sqlQuery += ' AND c.type_line LIKE ?';
      params.push('%Land%');
    }

    const [deckCardRows] = await pool.execute(sqlQuery, params);

    // Format deck cards
    const filteredCards = deckCardRows.map((row) => ({
      id: row.id,
      cardId: row.card_id,
      count: row.count,
      card: {
        id: row.card_id,
        name: row.name,
        manaCost: row.mana_cost,
        typeLine: row.type_line,
        oracleText: row.oracle_text,
        usd: row.usd,
        usdFoil: row.usd_foil,
        imageUrl: row.image_url,
        setName: row.set_name,
      },
    }));

    return res.json({ deckCards: filteredCards });
  } catch (error) {
    console.error('Error searching deck:', error.message);
    return res.status(500).json({ error: 'Error searching deck' });
  }
};

// Delete a deck
const deleteDeck = async (req, res) => {
  try {
    const { deckId } = req.body;
    const userId = req.user.id;

    if (!deckId) {
      return res.status(400).json({ error: 'Deck ID is required' });
    }

    // Verify deck belongs to user
    const [deckRows] = await pool.execute(
      'SELECT * FROM decks WHERE id = ? AND user_id = ?',
      [deckId, userId]
    );

    if (deckRows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Delete all cards in the deck first
    await pool.execute('DELETE FROM deck_cards WHERE deck_id = ?', [deckId]);

    // Delete the deck
    await pool.execute('DELETE FROM decks WHERE id = ?', [deckId]);

    return res.json({
      message: 'Deck deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting deck:', error.message);
    return res.status(500).json({ error: 'Error deleting deck' });
  }
};

// Upload a picture for a deck
const uploadDeckPicture = async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No picture uploaded' });
    }

    // Verify deck belongs to user
    const [deckRows] = await pool.execute(
      'SELECT * FROM decks WHERE id = ? AND user_id = ?',
      [deckId, userId]
    );

    if (deckRows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Update deck with picture
    await pool.execute('UPDATE decks SET picture = ? WHERE id = ?', [
      req.file.buffer,
      deckId,
    ]);

    return res.json({
      message: 'Deck picture uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading deck picture:', error.message);
    return res.status(500).json({ error: 'Error uploading deck picture' });
  }
};

// Remove a picture from a deck
const removeDeckPicture = async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.id;

    // Verify deck belongs to user
    const [deckRows] = await pool.execute(
      'SELECT * FROM decks WHERE id = ? AND user_id = ?',
      [deckId, userId]
    );

    if (deckRows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Update deck to remove picture
    await pool.execute('UPDATE decks SET picture = NULL WHERE id = ?', [
      deckId,
    ]);

    return res.json({
      message: 'Deck picture removed successfully',
    });
  } catch (error) {
    console.error('Error removing deck picture:', error.message);
    return res.status(500).json({ error: 'Error removing deck picture' });
  }
};

module.exports = {
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
};
