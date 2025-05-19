const express = require('express');
const router = express.Router();

// @route   /api/flash-sales
// @desc    Routes for FlashSale

router.get('/', (req, res) => {
  res.send('GET FlashSale');
});

module.exports = router;
