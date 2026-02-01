const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Import the routes
const financialRoutes = require('./src/routes/financial.routes').default;
app.use('/api/financial', financialRoutes);

// Create a token
const token = jwt.sign(
    {
        userId: 1,
        username: 'admin',
        name: 'Admin',
        role: 'super_admin',
        clinicId: 1,
    },
    process.env.JWT_SECRET || 'test-jwt-secret-key',
    { expiresIn: '1h' }
);

console.log('Token:', token.substring(0, 50) + '...');

// Make a test request
request(app)
    .post('/api/financial/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({
        type: 'income',
        amount: 150.0,
        category: 'Consulta',
        payment_method: 'pix',
        status: 'paid',
    })
    .then((res) => {
        console.log('Status:', res.status);
        console.log('Body:', res.body);
    })
    .catch((err) => {
        console.error('Error:', err.message);
    });
