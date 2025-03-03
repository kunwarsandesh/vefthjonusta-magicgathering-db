const request = require('supertest');
const { expect } = require('chai');
const app = require('../index');
const { initTestData } = require('./setup');

describe('Card API Tests', () => {
  let authToken;
  
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

  describe('Card Search and Retrieval', () => {
    it('should get search filters', async () => {
      const res = await request(app)
        .get('/api/cards/search/filters');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('cardTypes');
      expect(res.body).to.have.property('sets');
      expect(res.body.cardTypes).to.be.an('array');
      expect(res.body.sets).to.be.an('array');
    });

    it('should search for cards', async () => {
      // Mock your test or use a real query that won't hit external API
      const res = await request(app)
        .get('/api/cards/search')
        .query({ query: 'lightning' });

      // If using mock: expect specific response
      // If hitting real API: expect structure
      expect(res.status).to.equal(200);
      if (res.body.cards) {
        expect(res.body).to.have.property('cards');
        expect(res.body.cards).to.be.an('array');
      }
    });

    it('should get a specific card by ID', async () => {
      const res = await request(app)
        .get(`/api/cards/cards/test-card-id-1`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('name', 'Test Card');
      expect(res.body).to.have.property('type_line', 'Creature — Test');
    });
  });
});