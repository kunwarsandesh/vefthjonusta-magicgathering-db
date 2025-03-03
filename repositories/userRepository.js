const { pool } = require('../models/db');

// Find all users
const findAll = async () => {
  const [rows] = await pool.execute('SELECT * FROM users');
  return rows;
};

// Find user by ID
const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
};

// Find user by username
const findByUsername = async (username) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [
    username,
  ]);
  return rows.length > 0 ? rows[0] : null;
};

// Save user
const save = async (user) => {
  if (user.id) {
    // Update existing user
    await pool.execute(
      'UPDATE users SET username = ?, password = ?, photo = ? WHERE id = ?',
      [user.username, user.password, user.photo, user.id]
    );
  } else {
    // Create new user
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, created_at) VALUES (?, ?, NOW())',
      [user.username, user.password]
    );
    user.id = result.insertId;
  }
  return user;
};

// Delete user by ID
const deleteById = async (id) => {
  await pool.execute('DELETE FROM users WHERE id = ?', [id]);
};

module.exports = {
  findAll,
  findById,
  findByUsername,
  save,
  deleteById,
};
