const express = require('express');
const router = express.Router();

// @route   /api/bundles
// @desc    Routes for Bundle

router.get('/', (req, res) => {
  res.send('GET Bundle');
});

module.exports = router;
