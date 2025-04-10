// scripts/reset-test-db.js
const { pool } = require('../models/db');

const resetTestDatabase = async () => {
  try {
    console.log('Resetting test database...');
    
    // Disable foreign key checks temporarily
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Truncate all tables (this completely empties them)
    await pool.execute('TRUNCATE TABLE deck_cards');
    await pool.execute('TRUNCATE TABLE decks');
    await pool.execute('TRUNCATE TABLE inventory');
    await pool.execute('TRUNCATE TABLE cards');
    await pool.execute('TRUNCATE TABLE users');
    
    // Drop and recreate the wishlist table with the correct schema
    await pool.execute('DROP TABLE IF EXISTS wishlist');
    await pool.execute(`
      CREATE TABLE wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        card_id VARCHAR(255) NOT NULL,
        card_name VARCHAR(255) NOT NULL,
        set_name VARCHAR(255),
        price DECIMAL(10, 2),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_card (user_id, card_id)
      )
    `);
    
    // Re-enable foreign key checks
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Test database reset completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting test database:', error.message);
    process.exit(1);
  }
};

// Run the reset function
resetTestDatabase();