// routes/api/cart.routes.js
const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/cart.controller');
const { protect, optionalAuth } = require('../../middlewares/auth.middleware');

// Cart routes accessible with or without auth
router.get('/', optionalAuth, cartController.getCart);
router.post('/items', optionalAuth, cartController.addToCart);
router.put('/items/:id', optionalAuth, cartController.updateCartItem);
router.delete('/items/:id', optionalAuth, cartController.removeCartItem);
router.delete('/', optionalAuth, cartController.clearCart);
router.get('/summary', optionalAuth, cartController.getCartSummary);
router.post('/merge', protect, cartController.mergeCart);

module.exports = router;