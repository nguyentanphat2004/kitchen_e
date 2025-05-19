// routes/api/wishlist.routes.js
const express = require('express');
const router = express.Router();
const wishlistController = require('../../controllers/wishlist.controller');
const { protect } = require('../../middlewares/auth.middleware');

// All wishlist routes require authentication
router.get('/', protect, wishlistController.getWishlist);
router.post('/', protect, wishlistController.addToWishlist);
router.delete('/:id', protect, wishlistController.removeFromWishlist);
router.post('/toggle', protect, wishlistController.toggleWishlistItem);
router.get('/check/:productId', protect, wishlistController.checkWishlistItem);
router.delete('/', protect, wishlistController.clearWishlist);
router.put('/:id', protect, wishlistController.updateWishlistItemNote);
router.post('/:id/move-to-cart', protect, wishlistController.moveToCart);

module.exports = router;