// In middleware/auth.js
const authService = require('../services/authService');

const authenticate = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const result = authService.verifyToken(token);

  if (!result.valid) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = result.user;
  next();
};

module.exports = {
  authenticate,
};
