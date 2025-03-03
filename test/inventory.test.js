const request = require('supertest');
const { expect } = require('chai');
const app = require('../index');
const { initTestData } = require('./setup');

describe('Inventory Tests', () => {
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

  describe('Inventory Management', () => {
    it('should add a card to inventory', async () => {
      const res = await request(app)
        .post('/api/cards/add_card_to_inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: 'test-card-id-1'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('message', 'Card added to inventory successfully');
      expect(res.body).to.have.property('card');
      expect(res.body.card).to.have.property('name', 'Test Card');
    });

    it('should get user inventory', async () => {
      const res = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('inventory');
      expect(res.body.inventory).to.be.an('array');
      expect(res.body.inventory.length).to.be.at.least(1);
      expect(res.body.inventory[0].card).to.have.property('name', 'Test Card');
    });

    it('should update card quantity', async () => {
      const res = await request(app)
        .put('/api/inventory/update_quantity')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: 'test-card-id-1',
          quantity: 3
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'Card quantity updated successfully');
      expect(res.body).to.have.property('quantity', 3);
      
      // Verify the quantity was updated
      const inventoryRes = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`);
        
      const updatedCard = inventoryRes.body.inventory.find(item => item.cardId === 'test-card-id-1');
      expect(updatedCard).to.have.property('quantity', 3);
    });

    it('should remove a card from inventory', async () => {
      const res = await request(app)
        .delete('/api/inventory/remove_card')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: 'test-card-id-1'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'Card removed from inventory successfully');
      
      // Verify the card was removed
      const inventoryRes = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`);
        
      const removedCard = inventoryRes.body.inventory.find(item => item.cardId === 'test-card-id-1');
      expect(removedCard).to.be.undefined;
    });
  });
});