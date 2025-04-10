// wishlistService.js
const wishlistRepository = require('../repositories/wishlistRepository');

class WishlistService {
  async getWishlist(userId) {
    return wishlistRepository.findByUserId(userId);
  }

  async addCard(userId, cardId) {
    return wishlistRepository.addCard(userId, cardId);
  }

  async removeCard(userId, cardId) {
    return wishlistRepository.removeCard(userId, cardId);
  }
}

module.exports = new WishlistService();
