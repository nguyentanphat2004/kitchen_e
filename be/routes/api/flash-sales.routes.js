// be/routes/api/flash.sales.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middlewares/auth.middleware');
const {
  getFlashSales,
  getFlashSale,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  addFlashSaleItem,
  updateFlashSaleItem,
  removeFlashSaleItem,
  getFlashSaleItems,
  updateFlashSaleStatus,
  getActiveFlashSales
} = require('../../controllers/flash.sale.controller');

// @route   /api/flash-sales

// Public routes
router.get('/', getFlashSales);
router.get('/active', getActiveFlashSales);
router.get('/:id', getFlashSale);
router.get('/:id/items', getFlashSaleItems);

// Admin routes
router.post('/', protect, authorize('admin'), createFlashSale);
router.put('/:id', protect, authorize('admin'), updateFlashSale);
router.delete('/:id', protect, authorize('admin'), deleteFlashSale);
router.post('/:id/items', protect, authorize('admin'), addFlashSaleItem);
router.put('/items/:itemId', protect, authorize('admin'), updateFlashSaleItem);
router.delete('/items/:itemId', protect, authorize('admin'), removeFlashSaleItem);
router.put('/:id/status', protect, authorize('admin'), updateFlashSaleStatus);

module.exports = router;