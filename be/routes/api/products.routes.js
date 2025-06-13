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

// Admin/Staff product routes with multiple image upload
router.post(
  '/', 
  protect, 
  authorize('admin', 'staff'), 
  uploadProductImages, // Multiple images upload for products
  productController.createProduct
);

router.put(
  '/:id', 
  protect, 
  authorize('admin', 'staff'), 
  uploadProductImages, // Multiple images upload for products
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

// Product Variant routes with multiple image upload
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
  uploadVariantImages, // Multiple images upload for variants
  productVariantController.createProductVariant
);

router.put(
  '/:productId/variants/:id', 
  protect, 
  authorize('admin', 'staff'), 
  uploadVariantImages, // Multiple images upload for variants
  productVariantController.updateProductVariant
);

router.delete(
  '/:productId/variants/:id', 
  protect, 
  authorize('admin'), 
  productVariantController.deleteProductVariant
);

router.put(
  '/:productId/variants/:id/restore', 
  protect, 
  authorize('admin'), 
  productVariantController.restoreProductVariant
);

// Product Customization routes with multiple image upload
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
  uploadCustomizationImages, // Multiple images upload for customizations
  productCustomizationController.createProductCustomization
);

router.put(
  '/:productId/customizations/:id', 
  protect, 
  authorize('admin', 'staff'), 
  uploadCustomizationImages, // Multiple images upload for customizations
  productCustomizationController.updateProductCustomization
);

router.delete(
  '/:productId/customizations/:id', 
  protect, 
  authorize('admin'), 
  productCustomizationController.deleteProductCustomization
);

// Product Reviews routes with multiple image upload
router.get(
  '/:productId/reviews', 
  reviewController.getProductReviews
);

router.post(
  '/:productId/reviews', 
  protect, 
  authorize('customer'), 
  uploadReviewImages, // Multiple images upload for reviews
  reviewController.createReview
);

router.put(
  '/:productId/reviews/:id', 
  protect, 
  authorize('customer'), 
  uploadReviewImages, // Multiple images upload for reviews
  reviewController.updateReview
);

router.delete(
  '/:productId/reviews/:id', 
  protect, 
  authorize('customer', 'admin', 'staff'), 
  reviewController.deleteReview
);

module.exports = router;