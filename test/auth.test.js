const request = require('supertest');
const { expect } = require('chai');
const app = require('../index');
const { initTestData } = require('./setup');

describe('Authentication Tests', () => {
  before(async () => {
    // Initialize test data
    await initTestData();
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
        const uniqueUsername = `testuser_${Date.now()}`;
        const res = await request(app)
          .post('/api/users/register')
          .send({
            username: uniqueUsername,
            password: 'password123'
          });
      
        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('message', 'User registered successfully');
        expect(res.body).to.have.property('userId');
      });

    it('should not register a user with an existing username', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('should not register a user without a username or password', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          username: 'nopassword'
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });
  });

  describe('User Login', () => {
    it('should login a user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          username: 'testuser',
          password: 'testpassword'
        });

      // Log the entire response body for debugging
      console.log('Login response:', JSON.stringify(res.body, null, 2));
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'Login successful');
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('username', 'testuser');
    });

    it('should not login a user with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error');
    });

    it('should not login a non-existent user', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error');
    });
  });
});