const express = require('express');
const router = express.Router();

// @route   /api/orders
// @desc    Routes for Order

router.get('/', (req, res) => {
  res.send('GET Order');
});

module.exports = router;
