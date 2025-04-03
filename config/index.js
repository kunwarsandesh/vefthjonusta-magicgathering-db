require('dotenv').config();

// Parse DATABASE_URL if it exists
let dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// If DATABASE_URL is provided, use it instead
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    dbConfig = {
      host: url.hostname,
      port: url.port,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1) // Remove leading slash
    };
    console.log("Using database configuration from DATABASE_URL");
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error.message);
    console.warn('Falling back to individual DB_* environment variables');
  }
}

module.exports = {
  PORT: process.env.PORT || 8080,
  JWT_SECRET: process.env.JWT_SECRET || 'magic-inventory-secret-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'magic-inventory-refresh-secret-key', // Add this line
  JWT_EXPIRY: '24h',
  DB: dbConfig
};
