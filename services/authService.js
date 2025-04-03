const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRY } = require('../config');
const userRepository = require('../repositories/userRepository');

class AuthService {
  // Authenticate user and generate JWT token
  async authenticate(username, password) {
    const user = await userRepository.findByUsername(username);

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        photo: user.photo ? user.photo.toString('base64') : null,
      },
      token,
    };
  }

  // Register a new user
  async register(username, password) {
    // Check if user already exists
    const existingUser = await userRepository.findByUsername(username);

    if (existingUser) {
      return { success: false, error: 'Username already exists' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await userRepository.save({
      username,
      password: hashedPassword,
    });

    return {
      success: true,
      userId: user.id,
    };
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { valid: true, user: decoded };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }
  
  async refreshToken(refreshToken) {
    try {
        // Verify the refresh token (you might use jwt.verify here)
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET); // Use a separate secret for refresh tokens
        // Optionally, check that the refresh token exists in your database
        const newAccessToken = jwt.sign(
            { id: decoded.id, username: decoded.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );
        return { success: true, token: newAccessToken };
    } catch (error) {
        return { success: false, error: 'Invalid refresh token' };
    }
}
}

module.exports = new AuthService();
