const { pool } = require('../models/db');
const bcrypt = require('bcryptjs');

// Initialize test data without cleanup
const initTestData = async () => {
  try {
    console.log('Initializing test data...');
    
    // Create test user - use REPLACE INTO to handle duplicates
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    await pool.execute(
      'REPLACE INTO users (username, password, created_at) VALUES (?, ?, NOW())',
      ['testuser', hashedPassword]
    );
    
    // Create test card - use REPLACE INTO to handle duplicates
    await pool.execute(
      `REPLACE INTO cards 
       (id, name, mana_cost, type_line, oracle_text, usd, usd_foil, image_url, set_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'test-card-id-1',
        'Test Card',
        '{1}{B}',
        'Creature — Test',
        'This is a test card for unit testing.',
        '1.99',
        '5.99',
        'https://example.com/card.jpg',
        'Test Set'
      ]
    );
    
    console.log('Test data initialized successfully');
  } catch (error) {
    console.error('Error initializing test data:', error.message);
    throw error;
  }
};

module.exports = {
  initTestData
};