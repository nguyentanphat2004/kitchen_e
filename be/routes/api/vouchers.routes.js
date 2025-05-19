const express = require('express');
const router = express.Router();

// @route   /api/vouchers
// @desc    Routes for Voucher

router.get('/', (req, res) => {
  res.send('GET Voucher');
});

module.exports = router;
