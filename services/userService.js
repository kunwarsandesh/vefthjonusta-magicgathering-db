const userRepository = require('../repositories/userRepository');
const inventoryService = require('./inventoryService');

class UserService {
  // Find all users
  async findAll() {
    return userRepository.findAll();
  }

  // Find user by ID
  async findById(id) {
    return userRepository.findById(id);
  }

  // Find user by username
  async findByUsername(username) {
    return userRepository.findByUsername(username);
  }

  // Check if user exists
  async userExists(username) {
    const user = await userRepository.findByUsername(username);
    return !!user;
  }

  // Save user
  async save(user) {
    // In a real world application, we would also save associated inventory here
    // For now, we'll just handle the basic user save operation
    return userRepository.save(user);
  }

  // Delete user by ID
  async deleteById(id) {
    // In a real world application, we would handle related entities like inventory
    return userRepository.deleteById(id);
  }
}

module.exports = new UserService();
