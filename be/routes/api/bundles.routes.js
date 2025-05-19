// routes/api/bundles.routes.js
const express = require('express');
const router = express.Router();
const bundleController = require('../../controllers/bundle.controller');
const bundleItemController = require('../../controllers/bundle-item.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');
const { uploadSingle } = require('../../middlewares/upload.middleware');

// Public bundle routes
router.get('/', bundleController.getBundles);
router.get('/featured', bundleController.getFeaturedBundles);
router.get('/active', bundleController.getActiveBundles);
router.get('/:id', bundleController.getBundle);

// Admin/Staff bundle routes
router.post(
  '/', 
  protect, 
  authorize('admin', 'staff'), 
  uploadSingle('image'),
  bundleController.createBundle
);

router.put(
  '/:id', 
  protect, 
  authorize('admin', 'staff'), 
  uploadSingle('image'),
  bundleController.updateBundle
);

router.delete(
  '/:id', 
  protect, 
  authorize('admin'), 
  bundleController.deleteBundle
);

router.put(
  '/:id/restore', 
  protect, 
  authorize('admin'), 
  bundleController.restoreBundle
);

router.post(
  '/:id/calculate', 
  protect, 
  authorize('admin', 'staff'), 
  bundleController.calculateBundlePrices
);

// Bundle item routes
router.get(
  '/:bundleId/items',
  bundleItemController.getBundleItems
);

router.get(
  '/:bundleId/items/:id',
  bundleItemController.getBundleItem
);

router.post(
  '/:bundleId/items',
  protect,
  authorize('admin', 'staff'),
  bundleItemController.addBundleItem
);

router.put(
  '/:bundleId/items/:id',
  protect,
  authorize('admin', 'staff'),
  bundleItemController.updateBundleItem
);

router.delete(
  '/:bundleId/items/:id',
  protect,
  authorize('admin', 'staff'),
  bundleItemController.removeBundleItem
);

router.get(
  '/:bundleId/items/:id/alternatives',
  bundleItemController.getItemAlternatives
);

router.put(
  '/:bundleId/items/reorder',
  protect,
  authorize('admin', 'staff'),
  bundleItemController.reorderBundleItems
);

module.exports = router;