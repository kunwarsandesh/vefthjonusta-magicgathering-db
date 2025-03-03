const { pool } = require('../models/db');

// Helper functions for sorting inventory cards
const getCardsSortedByName = (inventoryCards) => {
  return [...inventoryCards].sort((a, b) => {
    const nameA = a.card.name ? a.card.name.toLowerCase() : '';
    const nameB = b.card.name ? b.card.name.toLowerCase() : '';
    return nameA.localeCompare(nameB);
  });
};

const getCardsSortedByManaCost = (inventoryCards) => {
  return [...inventoryCards].sort((a, b) => {
    const costA = a.card.mana_cost ? a.card.mana_cost : '';
    const costB = b.card.mana_cost ? b.card.mana_cost : '';
    return costA.localeCompare(costB);
  });
};

// Get user's inventory
const getInventory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get inventory cards with card details
    const [inventoryRows] = await pool.execute(
      `SELECT i.*, c.name, c.mana_cost, c.type_line, c.oracle_text, c.usd, c.usd_foil, c.image_url, c.set_name 
       FROM inventory i
       JOIN cards c ON i.card_id = c.id
       WHERE i.user_id = ?`,
      [userId]
    );

    // Format inventory cards
    const inventoryCards = inventoryRows.map((row) => ({
      id: row.id,
      cardId: row.card_id,
      quantity: row.quantity,
      condition: row.condition,
      addedAt: row.added_at,
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

    return res.json({ inventory: inventoryCards });
  } catch (error) {
    console.error('Error getting inventory:', error.message);
    return res.status(500).json({ error: 'Error retrieving inventory' });
  }
};

// Search user's inventory
const searchInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, color, type, isLegendary, isLand } = req.query;

    // Build query to search inventory
    let sqlQuery = `
      SELECT i.*, c.name, c.mana_cost, c.type_line, c.oracle_text, c.usd, c.usd_foil, c.image_url, c.set_name 
      FROM inventory i
      JOIN cards c ON i.card_id = c.id
      WHERE i.user_id = ?
    `;

    const params = [userId];

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

    const [inventoryRows] = await pool.execute(sqlQuery, params);

    // Format inventory cards
    const inventoryCards = inventoryRows.map((row) => ({
      id: row.id,
      cardId: row.card_id,
      quantity: row.quantity,
      condition: row.condition,
      addedAt: row.added_at,
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

    return res.json({ cards: inventoryCards });
  } catch (error) {
    console.error('Error searching inventory:', error.message);
    return res.status(500).json({ error: 'Error searching inventory' });
  }
};

// Update card quantity in inventory
const updateCardQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId, quantity } = req.body;

    if (!cardId || !quantity) {
      return res
        .status(400)
        .json({ error: 'Card ID and quantity are required' });
    }

    const quantityNum = parseInt(quantity);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      return res
        .status(400)
        .json({ error: 'Quantity must be a positive number' });
    }

    // Check if card exists in inventory
    const [inventoryRows] = await pool.execute(
      'SELECT * FROM inventory WHERE user_id = ? AND card_id = ?',
      [userId, cardId]
    );

    if (inventoryRows.length === 0) {
      return res.status(404).json({ error: 'Card not found in inventory' });
    }

    // Update quantity
    await pool.execute(
      'UPDATE inventory SET quantity = ? WHERE user_id = ? AND card_id = ?',
      [quantityNum, userId, cardId]
    );

    return res.json({
      message: 'Card quantity updated successfully',
      quantity: quantityNum,
    });
  } catch (error) {
    console.error('Error updating card quantity:', error.message);
    return res.status(500).json({ error: 'Error updating card quantity' });
  }
};

// Remove card from inventory
const removeCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.body;

    if (!cardId) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    // Check if card exists in inventory
    const [inventoryRows] = await pool.execute(
      'SELECT * FROM inventory WHERE user_id = ? AND card_id = ?',
      [userId, cardId]
    );

    if (inventoryRows.length === 0) {
      return res.status(404).json({ error: 'Card not found in inventory' });
    }

    // Remove card from inventory
    await pool.execute(
      'DELETE FROM inventory WHERE user_id = ? AND card_id = ?',
      [userId, cardId]
    );

    return res.json({
      message: 'Card removed from inventory successfully',
    });
  } catch (error) {
    console.error('Error removing card from inventory:', error.message);
    return res
      .status(500)
      .json({ error: 'Error removing card from inventory' });
  }
};

// Get inventory sorted by name or mana cost
const getSortedInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sortBy } = req.query;

    // Get inventory cards with card details
    const [inventoryRows] = await pool.execute(
      `SELECT i.*, c.name, c.mana_cost, c.type_line, c.oracle_text, c.usd, c.usd_foil, c.image_url, c.set_name 
       FROM inventory i
       JOIN cards c ON i.card_id = c.id
       WHERE i.user_id = ?`,
      [userId]
    );

    // Format inventory cards
    let inventoryCards = inventoryRows.map((row) => ({
      id: row.id,
      cardId: row.card_id,
      quantity: row.quantity,
      condition: row.condition,
      addedAt: row.added_at,
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

    // Apply sorting using helper functions
    if (sortBy === 'name') {
      inventoryCards = getCardsSortedByName(inventoryCards);
    } else if (sortBy === 'mana_cost') {
      inventoryCards = getCardsSortedByManaCost(inventoryCards);
    }

    return res.json({ inventory: inventoryCards });
  } catch (error) {
    console.error('Error getting sorted inventory:', error.message);
    return res.status(500).json({ error: 'Error retrieving sorted inventory' });
  }
};

module.exports = {
  getInventory,
  searchInventory,
  updateCardQuantity,
  removeCard,
  getSortedInventory,
};
