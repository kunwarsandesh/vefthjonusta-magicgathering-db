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