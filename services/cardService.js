const axios = require('axios');
const cardRepository = require('../repositories/cardRepository');

class CardService {
  constructor() {
    this.REQUEST_DELAY_MS = 100;
  }

  // Helper function to delay requests
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Fetch card data for multiple cards at once (like CardService.java's fetchCardsData)
  async fetchCardsData(inventoryCards) {
    const identifiers = inventoryCards.map((ic) => ({ id: ic.cardId }));

    try {
      const url = 'https://api.scryfall.com/cards/collection';
      const headers = { 'Content-Type': 'application/json' };

      await this.delay(this.REQUEST_DELAY_MS);
      const response = await axios.post(url, { identifiers }, { headers });

      // Create map from response data
      const idToCardMap = {};
      if (response.data && response.data.data) {
        response.data.data.forEach((cardData) => {
          const card = this.createCardFromResponseData(cardData);
          idToCardMap[card.id] = card;
        });
      }

      return idToCardMap;
    } catch (error) {
      console.error('Error fetching card collection data:', error.message);
      return {};
    }
  }

  // Find card by ID
  async findById(id) {
    return cardRepository.findById(id);
  }

  // Find card by name
  async findByName(name) {
    return cardRepository.findByName(name);
  }

  // Save card to database
  async save(card) {
    return cardRepository.save(card);
  }

  // Delete card from database
  async deleteById(id) {
    return cardRepository.deleteById(id);
  }

  // Helper to create card object from API response
  createCardFromResponseData(cardData) {
    const card = {
      id: cardData.id,
      name: cardData.name,
      mana_cost: cardData.mana_cost,
      type_line: cardData.type_line,
      oracle_text: cardData.oracle_text,
      usd: cardData.prices?.usd || null,
      usd_foil: cardData.prices?.usd_foil || null,
      image_url: cardData.image_uris?.normal || null,
      set_name: cardData.set_name || null,
    };

    // Log warning if card ID is null
    if (!card.id) {
      console.warn('Warning: Card ID is null for card:', cardData.name);
    }

    return card;
  }
}

module.exports = new CardService();
