const express = require('express');
const router = express.Router();

// @route   /api/wishlist
// @desc    Routes for Wishlist

router.get('/', (req, res) => {
  res.send('GET Wishlist');
});

module.exports = router;
