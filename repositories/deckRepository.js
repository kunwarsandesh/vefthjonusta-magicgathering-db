const { pool } = require('../models/db');

// Find deck by ID
const findById = async (deckId) => {
  const [rows] = await pool.execute('SELECT * FROM decks WHERE id = ?', [
    deckId,
  ]);
  return rows.length > 0 ? rows[0] : null;
};

// Find decks by user ID
const findByUserId = async (userId) => {
  const [rows] = await pool.execute('SELECT * FROM decks WHERE user_id = ?', [
    userId,
  ]);
  return rows;
};

// Create new deck
const create = async (name, userId) => {
  const [result] = await pool.execute(
    'INSERT INTO decks (name, user_id, created_at) VALUES (?, ?, NOW())',
    [name, userId]
  );

  return { id: result.insertId, name, userId };
};

// Update deck
const update = async (deck) => {
  await pool.execute('UPDATE decks SET name = ?, picture = ? WHERE id = ?', [
    deck.name,
    deck.picture,
    deck.id,
  ]);
  return deck;
};

// Delete deck
const deleteById = async (deckId) => {
  // First delete all cards in the deck
  await pool.execute('DELETE FROM deck_cards WHERE deck_id = ?', [deckId]);

  // Then delete the deck
  await pool.execute('DELETE FROM decks WHERE id = ?', [deckId]);
};

// Get deck cards
const getDeckCards = async (deckId) => {
  const [rows] = await pool.execute(
    `SELECT dc.*, c.name, c.mana_cost, c.type_line, c.oracle_text, c.usd, c.usd_foil, c.image_url, c.set_name 
     FROM deck_cards dc
     JOIN cards c ON dc.card_id = c.id
     WHERE dc.deck_id = ?`,
    [deckId]
  );

  return rows;
};

// Add card to deck
const addCard = async (deckId, cardId) => {
  // Check if card already exists in deck
  const [existingRows] = await pool.execute(
    'SELECT * FROM deck_cards WHERE deck_id = ? AND card_id = ?',
    [deckId, cardId]
  );

  if (existingRows.length > 0) {
    // Increment count if card already exists in deck
    await pool.execute(
      'UPDATE deck_cards SET count = count + 1 WHERE deck_id = ? AND card_id = ?',
      [deckId, cardId]
    );
    return { ...existingRows[0], count: existingRows[0].count + 1 };
  } else {
    // Add new card to deck
    const [result] = await pool.execute(
      'INSERT INTO deck_cards (deck_id, card_id, count) VALUES (?, ?, 1)',
      [deckId, cardId]
    );

    return { id: result.insertId, deckId, cardId, count: 1 };
  }
};

// Remove card from deck
const removeCard = async (deckId, cardId) => {
  // Get current count
  const [countRows] = await pool.execute(
    'SELECT count FROM deck_cards WHERE deck_id = ? AND card_id = ?',
    [deckId, cardId]
  );

  if (countRows.length === 0) {
    return { found: false };
  }

  const count = countRows[0].count;

  if (count > 1) {
    // Decrement count
    await pool.execute(
      'UPDATE deck_cards SET count = count - 1 WHERE deck_id = ? AND card_id = ?',
      [deckId, cardId]
    );
    return { found: true, removed: false, newCount: count - 1 };
  } else {
    // Remove card completely
    await pool.execute(
      'DELETE FROM deck_cards WHERE deck_id = ? AND card_id = ?',
      [deckId, cardId]
    );
    return { found: true, removed: true };
  }
};

module.exports = {
  findById,
  findByUserId,
  create,
  update,
  deleteById,
  getDeckCards,
  addCard,
  removeCard,
};
