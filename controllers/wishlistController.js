const { pool } = require('../models/db');

// Get wishlist for logged-in user
const getWishlist = async (req, res) => {
    try {
      const userId = req.user.id;
  
      // Execute query to fetch wishlist items; adjust fields as necessary.
      const [wishlistRows] = await pool.execute(
        `SELECT w.*, c.name, c.mana_cost, c.type_line, c.oracle_text, c.usd, c.usd_foil, c.image_url, c.set_name 
         FROM wishlist w
         JOIN cards c ON w.card_id = c.id
         WHERE w.user_id = ?`,
        [userId]
      );
  
      // Format wishlist cards – note we use row.card_id, row.name, etc.
      const wishlistCards = wishlistRows.map((row) => ({
        id: row.id,
        cardId: row.card_id,
        addedAt: row.added_at, // Assuming your wishlist table has an added_at column.
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
  
      return res.json({ wishlist: wishlistCards });
    } catch (error) {
      console.error('Error getting wishlist:', error.message);
      return res.status(500).json({ error: 'Error retrieving wishlist' });
    }
  };
  

// Remove a card from wishlist
const removeCardFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.body;
    if (!cardId) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    await wishlistService.removeCard(userId, cardId);
    return res.json({ message: 'Card removed from wishlist successfully' });
  } catch (error) {
    console.error('Error removing card from wishlist:', error.message);
    return res.status(500).json({ error: 'Error removing card from wishlist' });
  }
};

module.exports = {
  getWishlist,
  removeCardFromWishlist,
};
