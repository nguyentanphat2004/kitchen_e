const express = require('express');
const router = express.Router();

// @route   /api/categories
// @desc    Routes for Category

router.get('/', (req, res) => {
  res.send('GET Category');
});

module.exports = router;
