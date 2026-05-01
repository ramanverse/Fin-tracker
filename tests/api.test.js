const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

let token;
let userId;
let categoryId;
let transactionId;
let budgetId;

const uniqueEmail = `test${Date.now()}@example.com`;

// Teardown
afterAll(async () => {
  await db.query('DELETE FROM users WHERE email = $1', [uniqueEmail]);
  await db.pool.end();
});

describe('Finance Tracker API Tests', () => {
  
  describe('Authentication', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: uniqueEmail, password: 'password123' });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      token = res.body.token;
      userId = res.body.user.id;
    });

    it('should not register user with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User 2', email: uniqueEmail, password: 'password123' });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should login user and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: uniqueEmail, password: 'password123' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('Categories (Setup for Tx)', () => {
    it('should create a category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Food', type: 'expense' });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      categoryId = res.body.data.id;
    });
  });

  describe('Budgets', () => {
    it('should set a budget', async () => {
      const d = new Date();
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({ category_id: categoryId, limit_amount: 50, month: d.getMonth() + 1, year: d.getFullYear() });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      budgetId = res.body.data.id;
    });
  });

  describe('Transactions & Budget Overrun', () => {
    it('should create transaction and trigger overrun', async () => {
      const d = new Date();
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        // Intentionally sending without file to bypass multer complexity in simple test
        .send({
          category_id: categoryId,
          amount: 100, // 100 > 50 budget
          currency: 'USD',
          description: 'Expensive Dinner',
          date: d.toISOString().split('T')[0]
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      transactionId = res.body.data.id;

      // Check if notification was created for overrun
      const notifRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      
      expect(notifRes.body.data.length).toBeGreaterThan(0);
      expect(notifRes.body.data[0].message).toContain('Budget exceeded');
    });

    it('should handle negative amount as refund', async () => {
      const d = new Date();
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category_id: categoryId,
          amount: -20, // Negative amount
          currency: 'USD',
          description: 'Refund Dinner',
          date: d.toISOString().split('T')[0]
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.data.is_refund).toBe(true);
      expect(parseFloat(res.body.data.amount)).toBe(20);
    });

    it('should reject invalid currency code', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category_id: categoryId,
          amount: 10,
          currency: 'INVALID', // > 3 chars
          description: 'Bad Tx',
          date: '2025-04-01'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Reports', () => {
    it('should generate monthly report', async () => {
      const d = new Date();
      const res = await request(app)
        .get(`/api/reports?type=monthly&month=${d.getMonth()+1}&year=${d.getFullYear()}&currency=USD`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.expense).toBeDefined(); // The 100 expense
    });
  });

});
