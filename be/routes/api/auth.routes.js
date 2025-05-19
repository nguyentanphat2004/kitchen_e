const express = require('express');
const router = express.Router();

// @route   /api/auth
// @desc    Routes for Auth

router.get('/', (req, res) => {
  res.send('GET Auth');
});

module.exports = router;
