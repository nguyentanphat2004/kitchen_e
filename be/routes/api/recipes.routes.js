const express = require('express');
const router = express.Router();

// @route   /api/recipes
// @desc    Routes for Recipe

router.get('/', (req, res) => {
  res.send('GET Recipe');
});

module.exports = router;
