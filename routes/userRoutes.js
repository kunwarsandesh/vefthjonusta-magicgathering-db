const express = require('express');
const multer = require('multer');
const { 
  register, 
  login, 
  logout, 
  updatePhoto,
  removePhoto,
  getProfile
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Add the refresh token endpoint
router.post('/refresh_token', refresh);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.post('/update_photo', authenticate, upload.single('photo'), updatePhoto);
router.delete('/remove_photo', authenticate, removePhoto);

module.exports = router;