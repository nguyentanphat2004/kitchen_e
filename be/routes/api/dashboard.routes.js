const express = require('express');
const router = express.Router();

// @route   /api/dashboard
// @desc    Routes for Dashboard

router.get('/', (req, res) => {
  res.send('GET Dashboard');
});

module.exports = router;
