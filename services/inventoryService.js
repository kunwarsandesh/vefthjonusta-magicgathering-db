const inventoryRepository = require('../repositories/inventoryRepository');

class InventoryService {
  // Find inventory by user ID
  async findByUserId(userId) {
    return inventoryRepository.findByUserId(userId);
  }

  // Add card to inventory
  async addCard(userId, cardId, cardName, setName, price) {
    return inventoryRepository.addCard(
      userId,
      cardId,
      cardName,
      setName,
      price
    );
  }

  // Update card quantity
  async updateCardQuantity(userId, cardId, quantity) {
    return inventoryRepository.updateCardQuantity(userId, cardId, quantity);
  }

  // Remove card from inventory
  async removeCard(userId, cardId) {
    return inventoryRepository.removeCard(userId, cardId);
  }

  // Get sorted inventory
  async getSorted(userId, sortBy) {
    return inventoryRepository.getSorted(userId, sortBy);
  }
}

module.exports = new InventoryService();
