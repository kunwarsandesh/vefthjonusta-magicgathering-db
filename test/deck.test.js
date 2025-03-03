const request = require('supertest');
const { expect } = require('chai');
const app = require('../index');
const { initTestData } = require('./setup');

describe('Deck Tests', () => {
  let authToken;
  let deckId;
  
  before(async () => {
    // Initialize test data
    await initTestData();
    
    // Login to get auth token
    const res = await request(app)
      .post('/api/users/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });
    
    authToken = res.body.token;
  });

  describe('Deck Management', () => {
    it('should create a new deck', async () => {
      const res = await request(app)
        .post('/api/decks/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Deck'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('message', 'Deck created successfully');
      expect(res.body).to.have.property('deck');
      expect(res.body.deck).to.have.property('name', 'Test Deck');
      
      // Save deck ID for later tests
      deckId = res.body.deck.id;
    });

    it('should add a card to the deck', async () => {
      // First, add a card to inventory
      await request(app)
        .post('/api/cards/add_card_to_inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: 'test-card-id-1'
        });
        
      // Then add to deck
      const res = await request(app)
        .post('/api/decks/add_card')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: 'test-card-id-1',
          deckId: deckId
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('message', 'Card added to deck successfully');
      expect(res.body).to.have.property('card');
    });

    it('should view the deck with cards', async () => {
      const res = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('deck');
      expect(res.body.deck).to.have.property('name', 'Test Deck');
      expect(res.body.deck).to.have.property('deckCards');
      expect(res.body.deck.deckCards).to.be.an('array');
      expect(res.body.deck.deckCards.length).to.be.at.least(1);
      expect(res.body.deck.deckCards[0].card).to.have.property('name', 'Test Card');
    });

    it('should verify deck has required number of cards', async () => {
      const res = await request(app)
        .get(`/api/decks/${deckId}/verify`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('isValid');
      expect(res.body).to.have.property('totalCards');
      // Our test deck doesn't have 5 cards yet
      expect(res.body.isValid).to.equal(false);
    });

    it('should remove a card from the deck', async () => {
      const res = await request(app)
        .delete(`/api/decks/${deckId}/remove_card`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: 'test-card-id-1'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'Card updated in deck successfully');
      
      // Verify the card was removed
      const deckRes = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Authorization', `Bearer ${authToken}`);
        
      expect(deckRes.body.deck.deckCards.length).to.equal(0);
    });

    it('should delete the deck', async () => {
      const res = await request(app)
        .delete('/api/decks/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deckId: deckId
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'Deck deleted successfully');
    });
  });
});