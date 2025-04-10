// wishlistRepository.js
const { pool } = require('../models/db');

// Get wishlist by user ID
const findByUserId = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT w.id, w.card_id, w.added_at, 
            c.name, c.mana_cost, c.type_line, c.oracle_text, c.usd, c.usd_foil, c.image_url, c.set_name 
     FROM wishlist w
     JOIN cards c ON w.card_id = c.id
     WHERE w.user_id = ?`,
    [userId]
  );
  return rows;
};

// Add card to wishlist
const addCard = async (userId, cardId, cardName, setName) => {
  // Check if the card already exists in the wishlist
  const [existingRows] = await pool.execute(
    'SELECT * FROM wishlist WHERE user_id = ? AND card_id = ?',
    [userId, cardId]
  );
  if (existingRows.length > 0) {
    // If the card already exists, you can choose to return it or send an error
    return { alreadyExists: true, record: existingRows[0] };
  } else {
    const [result] = await pool.execute(
      'INSERT INTO wishlist (user_id, card_id, card_name, set_name) VALUES (?, ?, ?, ?)',
      [userId, cardId, cardName, setName]
    );
    return { id: result.insertId, cardId };
  }
};

// Remove card from wishlist
const removeCard = async (userId, cardId) => {
  await pool.execute(
    'DELETE FROM wishlist WHERE user_id = ? AND card_id = ?',
    [userId, cardId]
  );
};

module.exports = {
  findByUserId,
  addCard,
  removeCard,
};
