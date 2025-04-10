const axios = require('axios');
const NodeCache = require('node-cache');
const { pool } = require('../models/db');
const cardRepository = require('../repositories/cardRepository');
const inventoryRepository = require('../repositories/inventoryRepository');
const wishlistRepository = require('../repositories/wishlistRepository');
const userRepository = require('../repositories/userRepository');


// Cache for storing search results
const searchCache = new NodeCache({ stdTTL: 600 }); // 10 minutes TTL
const CARDS_PER_PAGE = 12;
const REQUEST_DELAY_MS = 100;

// Helper function to delay requests to avoid rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper functions for checking card properties
function isLegendary(typeLine) {
  return typeLine && typeLine.toLowerCase().includes('legendary');
}

function isLand(typeLine) {
  return typeLine && typeLine.toLowerCase().includes('land');
}

// Helper function to create card object from API response
function createCardFromResponseData(cardData) {
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
    isLegendary: isLegendary(cardData.type_line),
    isLand: isLand(cardData.type_line),
  };

  // Log warning if card ID is null
  if (!card.id) {
    console.warn('Warning: Card ID is null for card:', cardData.name);
  }

  return card;
}

// Get card types and sets for search filters
const getSearchFilters = async (req, res) => {
  try {
    // Get card types
    await delay(REQUEST_DELAY_MS);
    const cardTypesResponse = await axios.get(
      'https://api.scryfall.com/catalog/card-types'
    );
    const cardTypes = cardTypesResponse.data.data || [];

    // Get sets
    await delay(REQUEST_DELAY_MS);
    const setsResponse = await axios.get('https://api.scryfall.com/sets');
    const sets = setsResponse.data.data || [];

    return res.json({
      cardTypes,
      sets,
    });
  } catch (error) {
    console.error('Error fetching search filters:', error.message);

    if (error.response && error.response.status === 429) {
      return res
        .status(429)
        .json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    return res
      .status(500)
      .json({ error: 'Error fetching data from Scryfall API' });
  }
};

// Search for cards based on filters
const searchCards = async (req, res) => {
  try {
    const { query, type, set, color, rarity, isLegendary, isLand } = req.query;

    // Build search URL
    let urlBuilder = 'https://api.scryfall.com/cards/search?q=';

    if (query && query.trim()) urlBuilder += query.trim();
    if (type) urlBuilder += `+t:${type}`;
    if (set) urlBuilder += `+e:${set}`;
    if (color) urlBuilder += `+c:${color}`;

    // Process multiple rarity values
    if (rarity && Array.isArray(rarity) && rarity.length > 0) {
      urlBuilder += '+(';
      rarity.forEach((r, index) => {
        urlBuilder += `r:${r}`;
        if (index !== rarity.length - 1) {
          urlBuilder += '+or+';
        }
      });
      urlBuilder += ')';
    } else if (rarity && !Array.isArray(rarity)) {
      urlBuilder += `+r:${rarity}`;
    }

    if (isLegendary === 'true') urlBuilder += '+t:legendary';
    if (isLand === 'true') {
      if (color) urlBuilder += `+id:${color}`;
      urlBuilder += '+t:land';
    }

    // Check if we have cached results
    const cacheKey = urlBuilder;
    const cachedResults = searchCache.get(cacheKey);

    if (cachedResults) {
      return res.json({ cards: cachedResults });
    }

    // Make API request if not cached
    await delay(REQUEST_DELAY_MS);
    const response = await axios.get(urlBuilder);

    // Process and format cards
    const cards = response.data.data.map((cardData) =>
      createCardFromResponseData(cardData)
    );

    // Cache the results
    searchCache.set(cacheKey, cards);

    // Calculate pagination
    const page = parseInt(req.query.page) || 1;
    const totalCards = cards.length;
    const totalPages = Math.ceil(totalCards / CARDS_PER_PAGE);
    const start = (page - 1) * CARDS_PER_PAGE;
    const end = Math.min(start + CARDS_PER_PAGE, totalCards);

    return res.json({
      cards: cards.slice(start, end),
      pagination: {
        totalCards,
        totalPages,
        currentPage: page,
        cardsPerPage: CARDS_PER_PAGE,
      },
    });
  } catch (error) {
    console.error('Error searching cards:', error.message);

    if (error.response && error.response.status === 429) {
      return res
        .status(429)
        .json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    return res
      .status(500)
      .json({ error: 'Error searching cards from Scryfall API' });
  }
};

// Get paginated search results
const getPaginatedResults = async (req, res) => {
  try {
    const { sessionId, page = 1 } = req.params;

    // Get cached cards for this session
    const cachedCards = searchCache.get(sessionId);

    if (!cachedCards || cachedCards.length === 0) {
      return res
        .status(404)
        .json({ error: 'No search results found. Please perform a search.' });
    }

    // Calculate pagination
    const totalCards = cachedCards.length;
    const totalPages = Math.ceil(totalCards / CARDS_PER_PAGE);
    const start = (parseInt(page) - 1) * CARDS_PER_PAGE;
    const end = Math.min(start + CARDS_PER_PAGE, totalCards);

    return res.json({
      cards: cachedCards.slice(start, end),
      pagination: {
        totalCards,
        totalPages,
        currentPage: parseInt(page),
        cardsPerPage: CARDS_PER_PAGE,
      },
    });
  } catch (error) {
    console.error('Error getting paginated results:', error.message);
    return res
      .status(500)
      .json({ error: 'Error retrieving paginated results' });
  }
};

// Get card by ID
const getCardById = async (req, res) => {
  try {
    const { cardId } = req.params;

    // First check if card exists in our database
    const card = await cardRepository.findById(cardId);

    if (card) {
      return res.json(card);
    }

    // If not in database, fetch from Scryfall API
    await delay(REQUEST_DELAY_MS);
    const response = await axios.get(
      `https://api.scryfall.com/cards/${cardId}`
    );
    const newCard = createCardFromResponseData(response.data);

    // Save card to database for future use
    await cardRepository.save(newCard);

    return res.json(newCard);
  } catch (error) {
    console.error('Error getting card by ID:', error.message);
    return res.status(500).json({ error: 'Error fetching card data' });
  }
};

// Add card to user's inventory
const addCardToInventory = async (req, res) => {
  try {
    const { cardId } = req.body;
    const userId = req.user.id;

    if (!cardId) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    // Check if user exists
    const userRepository = require('../repositories/userRepository');
    const user = await userRepository.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if card exists in our database
    let card = await cardRepository.findById(cardId);

    // If card doesn't exist in our database, fetch it from Scryfall API
    if (!card) {
      try {
        await delay(REQUEST_DELAY_MS);
        const response = await axios.get(
          `https://api.scryfall.com/cards/${cardId}`
        );
        card = createCardFromResponseData(response.data);

        // Save card to database
        await cardRepository.save(card);
      } catch (error) {
        return res.status(404).json({ error: 'Card not found' });
      }
    }

    // Add card to user's inventory
    const inventoryCard = await inventoryRepository.addCard(
      userId,
      cardId,
      card.name,
      card.set_name,
      card.usd
    );

    return res.status(201).json({
      message: 'Card added to inventory successfully',
      card,
      inventoryCard,
    });
  } catch (error) {
    console.error('Error adding card to inventory:', error.message);
    return res.status(500).json({ error: 'Error adding card to inventory' });
  }
};

// Add card to user's wishlist
const addCardToWishlist = async (req, res) => {
  try {
    const { cardId } = req.body;
    const userId = req.user.id;

    if (!cardId) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    // Check if user exists
    const user = await userRepository.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the card exists in our database
    let card = await cardRepository.findById(cardId);

    // If card doesn't exist, fetch it from Scryfall API
    if (!card) {
      try {
        await delay(REQUEST_DELAY_MS);
        const response = await axios.get(`https://api.scryfall.com/cards/${cardId}`);
        card = createCardFromResponseData(response.data);
        // Save card to database
        await cardRepository.save(card);
      } catch (error) {
        return res.status(404).json({ error: 'Card not found' });
      }
    }

    // Add card to user's wishlist using the wishlist repository
    const result = await wishlistRepository.addCard(userId, cardId, card.name, card.set_name);

    if (result.alreadyExists) {
      return res.status(400).json({ error: 'Card already exists in wishlist' });
    }

    return res.status(201).json({
      message: 'Card added to wishlist successfully',
      card,
      wishlistRecord: result, // Contains details like the new wishlist record id
    });
  } catch (error) {
    console.error('Error adding card to wishlist:', error.message);
    return res.status(500).json({ error: 'Error adding card to wishlist' });
  }
};

module.exports = {
  getSearchFilters,
  searchCards,
  getPaginatedResults,
  getCardById,
  addCardToInventory,
  addCardToWishlist,
};
