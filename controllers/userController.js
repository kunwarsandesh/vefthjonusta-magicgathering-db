const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../models/db');
const { JWT_SECRET, JWT_EXPIRY } = require('../config');

const userService = require('../services/userService');
const authService = require('../services/authService');

// Register a new user
const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    const result = await authService.register(username, password);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      message: 'User registered successfully',
      userId: result.userId,
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    const result = await authService.authenticate(username, password);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    // Set token in cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout user
const logout = (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logout successful' });
};

// Update user profile picture
const updatePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    // Update user's photo
    await pool.execute('UPDATE users SET photo = ? WHERE id = ?', [
      req.file.buffer,
      userId,
    ]);

    return res.json({
      message: 'Photo updated successfully',
      photo: req.file.buffer.toString('base64'),
    });
  } catch (error) {
    console.error('Update photo error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove user profile picture
const removePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    // Remove user's photo
    await pool.execute('UPDATE users SET photo = NULL WHERE id = ?', [userId]);

    return res.json({
      message: 'Photo removed successfully',
    });
  } catch (error) {
    console.error('Remove photo error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user information
    const [users] = await pool.execute(
      'SELECT id, username, photo, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        photo: user.photo ? user.photo.toString('base64') : null,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
  }
  const result = await authService.refreshToken(refreshToken);
  if (result.success) {
      return res.json({ token: result.token });
  } else {
      return res.status(401).json({ error: result.error });
  }
};

module.exports = {
  register,
  login,
  logout,
  updatePhoto,
  removePhoto,
  getProfile,
  refresh,
};
