// routes/api/products.routes.js
const express = require('express');
const router = express.Router();
const productController = require('../../controllers/product.controller');
const productVariantController = require('../../controllers/product-variant.controller');
const productCustomizationController = require('../../controllers/product-customization.controller');
const reviewController = require('../../controllers/review.controller');
const { protect, authorize, optionalAuth } = require('../../middlewares/auth.middleware');
const { 
  uploadProductImages, 
  uploadVariantImages, 
  uploadCustomizationImages,
  uploadReviewImages
} = require('../../middlewares/upload.middleware');

// Public product routes
router.get('/search', productController.searchProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/best-selling', productController.getBestSellingProducts);
router.get('/', optionalAuth, productController.getProducts);
router.get('/:id', optionalAuth, productController.getProduct);

// Admin/Staff product routes with proper upload middleware
router.post(
  '/', 
  protect, 
  authorize('admin', 'staff'), 
  uploadProductImages, // Uses uploadMultiple('images', 10)
  productController.createProduct
);

router.put(
  '/:id', 
  protect, 
  authorize('admin', 'staff'), 
  uploadProductImages, // Uses uploadMultiple('images', 10)
  productController.updateProduct
);

router.delete(
  '/:id', 
  protect, 
  authorize('admin'), 
  productController.deleteProduct
);

router.put(
  '/:id/restore', 
  protect, 
  authorize('admin'), 
  productController.restoreProduct
);

// Product Variant routes with proper upload middleware
router.get(
  '/:productId/variants', 
  productVariantController.getProductVariants
);

router.get(
  '/:productId/variants/:id', 
  productVariantController.getProductVariant
);

router.post(
  '/:productId/variants', 
  protect, 
  authorize('admin', 'staff'), 
  uploadVariantImages, // Uses uploadMultiple('images', 5)
  productVariantController.createProductVariant
);

router.put(
  '/:productId/variants/:id', 
  protect, 
  authorize('admin', 'staff'), 
  uploadVariantImages, // Uses uploadMultiple('images', 5)
  productVariantController.updateProductVariant
);

router.delete(
  '/:productId/variants/:id', 
  protect, 
  authorize('admin'), 
  productVariantController.deleteProductVariant
);

// Add restore route for variants
router.put(
  '/:productId/variants/:id/restore', 
  protect, 
  authorize('admin'), 
  productVariantController.restoreProductVariant
);

// Product Customization routes with proper upload middleware
router.get(
  '/:productId/customizations', 
  productCustomizationController.getProductCustomizations
);

router.get(
  '/:productId/customizations/:id', 
  productCustomizationController.getProductCustomization
);

router.post(
  '/:productId/customizations', 
  protect, 
  authorize('admin', 'staff'), 
  uploadCustomizationImages, // Uses uploadMultiple('optionImages', 10)
  productCustomizationController.createProductCustomization
);

router.put(
  '/:productId/customizations/:id', 
  protect, 
  authorize('admin', 'staff'), 
  uploadCustomizationImages, // Uses uploadMultiple('optionImages', 10)
  productCustomizationController.updateProductCustomization
);

router.delete(
  '/:productId/customizations/:id', 
  protect, 
  authorize('admin'), 
  productCustomizationController.deleteProductCustomization
);

// Product Reviews routes with proper upload middleware
router.get(
  '/:productId/reviews', 
  reviewController.getProductReviews
);

router.post(
  '/:productId/reviews', 
  protect, 
  authorize('customer'), 
  uploadReviewImages, // Uses uploadMultiple('images', 5)
  reviewController.createReview
);

router.put(
  '/:productId/reviews/:id', 
  protect, 
  authorize('customer'), 
  uploadReviewImages, // Uses uploadMultiple('images', 5)
  reviewController.updateReview
);

router.delete(
  '/:productId/reviews/:id', 
  protect, 
  authorize('customer', 'admin', 'staff'), 
  reviewController.deleteReview
);

module.exports = router;