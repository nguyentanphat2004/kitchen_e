const express = require('express');
const router = express.Router();

// @route   /api/users
// @desc    Routes for User

router.get('/', (req, res) => {
  res.send('GET User');
});

module.exports = router;
