const { pool } = require('../models/db');

// Get inventory by user ID
const findByUserId = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT i.*, c.name, c.mana_cost, c.type_line, c.oracle_text, c.usd, c.usd_foil, c.image_url, c.set_name 
     FROM inventory i
     JOIN cards c ON i.card_id = c.id
     WHERE i.user_id = ?`,
    [userId]
  );

  return rows;
};

// Add card to inventory
const addCard = async (userId, cardId, cardName, setName, price) => {
  // Check if card already exists in inventory
  const [existingRows] = await pool.execute(
    'SELECT * FROM inventory WHERE user_id = ? AND card_id = ?',
    [userId, cardId]
  );

  if (existingRows.length > 0) {
    // Increment quantity if card already in inventory
    await pool.execute(
      'UPDATE inventory SET quantity = quantity + 1 WHERE user_id = ? AND card_id = ?',
      [userId, cardId]
    );
    return existingRows[0];
  } else {
    // Add new card to inventory
    const [result] = await pool.execute(
      `INSERT INTO inventory 
       (user_id, card_id, card_name, set_name, price, quantity, condition, added_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        cardId,
        cardName,
        setName || null,
        price || null,
        1, // Default quantity
        'Near Mint', // Default condition
      ]
    );

    return { id: result.insertId, cardId, quantity: 1 };
  }
};

// Update card quantity
const updateCardQuantity = async (userId, cardId, quantity) => {
  await pool.execute(
    'UPDATE inventory SET quantity = ? WHERE user_id = ? AND card_id = ?',
    [quantity, userId, cardId]
  );
};

// Remove card from inventory
const removeCard = async (userId, cardId) => {
  await pool.execute(
    'DELETE FROM inventory WHERE user_id = ? AND card_id = ?',
    [userId, cardId]
  );
};

// Get inventory sorted by field
const getSorted = async (userId, sortBy) => {
  let orderBy = '';

  if (sortBy === 'name') {
    orderBy = 'ORDER BY c.name ASC';
  } else if (sortBy === 'mana_cost') {
    orderBy = 'ORDER BY c.mana_cost ASC';
  }

  const [rows] = await pool.execute(
    `SELECT i.*, c.name, c.mana_cost, c.type_line, c.oracle_text, c.usd, c.usd_foil, c.image_url, c.set_name 
     FROM inventory i
     JOIN cards c ON i.card_id = c.id
     WHERE i.user_id = ? ${orderBy}`,
    [userId]
  );

  return rows;
};

module.exports = {
  findByUserId,
  addCard,
  updateCardQuantity,
  removeCard,
  getSorted,
};
