const express = require('express');
const router = express.Router();

// @route   /api/carts
// @desc    Routes for Cart

router.get('/', (req, res) => {
  res.send('GET Cart');
});

module.exports = router;
