const mysql = require('mysql2/promise');
const { DB } = require('../config');

// Function to parse database URL if it exists
const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    try {
      // Parse the URL
      const url = new URL(databaseUrl);
      
      return {
        host: url.hostname,
        port: url.port,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1) // Remove leading slash
      };
    } catch (error) {
      console.error('Error parsing DATABASE_URL:', error.message);
      console.warn('Falling back to individual environment variables');
    }
  }
  
  // Fall back to individual config values from config.js
  return DB;
};

// Create a connection pool with parsed config
const dbConfig = getDatabaseConfig();
const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    console.log(`Connected to ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error(`Failed to connect to ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);
    return false;
  }
};

// Initialize database tables
const initDatabase = async () => {
  try {
    // Create users table if not exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        photo LONGBLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create cards table if not exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cards (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mana_cost VARCHAR(255),
        type_line VARCHAR(255),
        oracle_text TEXT,
        usd VARCHAR(50),
        usd_foil VARCHAR(50),
        image_url VARCHAR(255),
        set_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create inventory table if not exists - Note: 'condition' is escaped with backticks
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        card_id VARCHAR(255) NOT NULL,
        card_name VARCHAR(255) NOT NULL,
        set_name VARCHAR(255),
        price DECIMAL(10, 2),
        quantity INT DEFAULT 1,
        \`condition\` VARCHAR(50) DEFAULT 'Near Mint',
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
      )
    `);

    // Create decks table if not exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS decks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        picture LONGBLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create wishlist table if not exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        card_id VARCHAR(255) NOT NULL,
        card_name VARCHAR(255) NOT NULL,
        set_name VARCHAR(255),
        price DECIMAL(10, 2),
        quantity INT DEFAULT 1,
        \`condition\` VARCHAR(50) DEFAULT 'Near Mint',
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
      )
    `);

    // Create deck_cards table if not exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS deck_cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deck_id INT NOT NULL,
        card_id VARCHAR(255) NOT NULL,
        count INT DEFAULT 1,
        FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
        UNIQUE KEY deck_card (deck_id, card_id)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initDatabase,
};