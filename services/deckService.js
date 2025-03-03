const deckRepository = require('../repositories/deckRepository');
const cardRepository = require('../repositories/cardRepository');

class DeckService {
  // Find deck by ID
  async findById(deckId) {
    return deckRepository.findById(deckId);
  }

  // Find decks by user ID
  async findByUserId(userId) {
    return deckRepository.findByUserId(userId);
  }

  // Create new deck
  async create(name, userId) {
    return deckRepository.create(name, userId);
  }

  // Update deck
  async update(deck) {
    return deckRepository.update(deck);
  }

  // Delete deck
  async deleteById(deckId) {
    return deckRepository.deleteById(deckId);
  }

  // Get deck cards
  async getDeckCards(deckId) {
    return deckRepository.getDeckCards(deckId);
  }

  // Add card to deck
  async addCard(deckId, cardId) {
    return deckRepository.addCard(deckId, cardId);
  }

  // Remove card from deck
  async removeCard(deckId, cardId) {
    return deckRepository.removeCard(deckId, cardId);
  }

  // Verify if deck is valid (has at least 5 cards)
  async verifyDeck(deckId) {
    const deckCards = await deckRepository.getDeckCards(deckId);

    const totalCards = deckCards.reduce((total, card) => total + card.count, 0);

    return {
      isValid: totalCards >= 5,
      totalCards,
      message:
        totalCards >= 5
          ? 'Deck is valid. It has at least 5 cards.'
          : 'Deck is invalid. It must have at least 5 cards.',
    };
  }

  // Search for cards in deck
  async searchDeckCards(deckId, query, color, type, isLegendary, isLand) {
    const deckCards = await deckRepository.getDeckCards(deckId);

    return deckCards.filter((card) => {
      let matches = true;

      if (query) {
        matches =
          matches && card.name.toLowerCase().includes(query.toLowerCase());
      }

      if (color) {
        matches = matches && card.mana_cost && card.mana_cost.includes(color);
      }

      if (type) {
        matches =
          matches &&
          card.type_line &&
          card.type_line.toLowerCase().includes(type.toLowerCase());
      }

      if (isLegendary) {
        matches =
          matches &&
          card.type_line &&
          card.type_line.toLowerCase().includes('legendary');
      }

      if (isLand) {
        matches =
          matches &&
          card.type_line &&
          card.type_line.toLowerCase().includes('land');
      }

      return matches;
    });
  }
}

module.exports = new DeckService();
