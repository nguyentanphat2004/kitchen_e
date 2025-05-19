const express = require('express');
const router = express.Router();

// @route   /api/reviews
// @desc    Routes for Review

router.get('/', (req, res) => {
  res.send('GET Review');
});

module.exports = router;
