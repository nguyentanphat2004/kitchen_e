const express = require('express');
const router = express.Router();

// @route   /api/payments
// @desc    Routes for Payment

router.get('/', (req, res) => {
  res.send('GET Payment');
});

module.exports = router;
