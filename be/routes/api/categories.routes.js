const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/category.controller');
const { protect, authorize, optionalAuth } = require('../../middlewares/auth.middleware');
const { uploadCategoryImage } = require('../../middlewares/upload.middleware');

// Public category routes
router.get('/', categoryController.getCategories);
router.get('/featured', categoryController.getFeaturedCategories);
router.get('/:id', categoryController.getCategory);
router.get('/:id/products', categoryController.getCategoryProducts);

// Admin/Staff category routes with proper image upload
router.post(
  '/',
  protect,
  authorize('admin', 'staff'),
  uploadCategoryImage, // Single image upload for categories
  categoryController.createCategory
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'staff'),
  uploadCategoryImage, // Single image upload for categories
  categoryController.updateCategory
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  categoryController.deleteCategory
);

router.put(
  '/:id/restore',
  protect,
  authorize('admin'),
  categoryController.restoreCategory
);

router.put(
  '/reorder',
  protect,
  authorize('admin', 'staff'),
  categoryController.reorderCategories
);

module.exports = router;
