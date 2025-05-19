const express = require('express');
const router = express.Router();

// @route   /api/ai
// @desc    Routes for AI

router.get('/', (req, res) => {
  res.send('GET AI');
});

module.exports = router;
