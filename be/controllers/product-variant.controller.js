// controllers/product-variant.controller.js
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { uploadImage, deleteImage } = require('../services/image.service');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/async.middleware');
const mongoose = require('mongoose');

/**
 * @desc    Get all variants for a product
 * @route   GET /api/products/:productId/variants
 * @access  Public
 */
exports.getProductVariants = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product || product.isDeleted) {
    throw new ApiError('Product not found', 404);
  }

  // Get all variants for this product
  const variants = await ProductVariant.find({ 
    productId, 
    isDeleted: false 
  }).sort('sortOrder name');

  return ApiResponse.success(res, { variants });
});

/**
 * @desc    Get a specific variant
 * @route   GET /api/products/:productId/variants/:id
 * @access  Public
 */
exports.getProductVariant = asyncHandler(async (req, res) => {
  const { productId, id } = req.params;

  // Find the variant
  const variant = await ProductVariant.findOne({ 
    _id: id, 
    productId,
    isDeleted: false 
  });

  if (!variant) {
    throw new ApiError('Product variant not found', 404);
  }

  // Get the product for basic info
  const product = await Product.findById(productId, 'name basePrice');

  return ApiResponse.success(res, { 
    variant,
    product: {
      _id: product._id,
      name: product.name,
      basePrice: product.basePrice
    }
  });
});

/**
 * @desc    Create a new product variant
 * @route   POST /api/products/:productId/variants
 * @access  Private (Admin, Staff)
 */
exports.createProductVariant = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const {
    name,
    sku,
    color,
    size,
    material,
    priceAdjustment,
    stockQuantity,
    sortOrder,
    ...otherFields
  } = req.body;

  // Validate required fields
  if (!name || !sku) {
    throw new ApiError('Please provide name and SKU', 400);
  }

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product || product.isDeleted) {
    throw new ApiError('Product not found', 404);
  }

  // Check if SKU is unique
  const existingSku = await ProductVariant.findOne({ sku });
  if (existingSku) {
    throw new ApiError('SKU already exists', 400);
  }

  // Create variant object
  const variantData = {
    productId,
    name,
    sku,
    color: color || null,
    size: size || null,
    material: material || null,
    priceAdjustment: priceAdjustment ? Number(priceAdjustment) : 0,
    stockQuantity: stockQuantity ? Number(stockQuantity) : 0,
    sortOrder: sortOrder ? Number(sortOrder) : 0,
    ...otherFields
  };

  // Upload images if provided
  if (req.files && req.files.length > 0) {
    const images = [];
    
    for (const file of req.files) {
      try {
        const result = await uploadImage(file, 'variants');
        images.push({
          url: result.url,
          altText: `${product.name} - ${name}`
        });
      } catch (error) {
        throw new ApiError(`Image upload failed: ${error.message}`, 500);
      }
    }
    
    variantData.images = images;
  }

  // Create the variant
  const variant = await ProductVariant.create(variantData);

  return ApiResponse.created(res, { variant });
});

/**
 * @desc    Update a product variant
 * @route   PUT /api/products/:productId/variants/:id
 * @access  Private (Admin, Staff)
 */
exports.updateProductVariant = asyncHandler(async (req, res) => {
  const { productId, id } = req.params;
  const {
    name,
    sku,
    color,
    size,
    material,
    priceAdjustment,
    stockQuantity,
    sortOrder,
    isActive,
    removeImages,
    ...otherFields
  } = req.body;

  // Find the variant
  const variant = await ProductVariant.findOne({ 
    _id: id, 
    productId,
    isDeleted: false 
  });

  if (!variant) {
    throw new ApiError('Product variant not found', 404);
  }

  // Check SKU uniqueness if changed
  if (sku && sku !== variant.sku) {
    const existingSku = await ProductVariant.findOne({ 
      sku, 
      _id: { $ne: id } 
    });
    
    if (existingSku) {
      throw new ApiError('SKU already exists', 400);
    }
  }

  // Create update object
  const updateData = {
    ...(name && { name }),
    ...(sku && { sku }),
    ...(color !== undefined && { color }),
    ...(size !== undefined && { size }),
    ...(material !== undefined && { material }),
    ...(priceAdjustment !== undefined && { 
      priceAdjustment: Number(priceAdjustment) 
    }),
    ...(stockQuantity !== undefined && { 
      stockQuantity: Number(stockQuantity) 
    }),
    ...(sortOrder !== undefined && { 
      sortOrder: Number(sortOrder) 
    }),
    ...(isActive !== undefined && { 
      isActive: isActive === 'true' || isActive === true 
    }),
    ...otherFields
  };

  // Handle image removal if specified
  if (removeImages) {
    const imagesToRemove = Array.isArray(removeImages) 
      ? removeImages 
      : [removeImages];
    
    // Delete images from storage
    for (const imageUrl of imagesToRemove) {
      try {
        await deleteImage(imageUrl);
      } catch (error) {
        console.error(`Failed to delete image ${imageUrl}: ${error.message}`);
        // Continue with other images even if one fails
      }
    }
    
    // Update the images array
    updateData.images = variant.images.filter(
      image => !imagesToRemove.includes(image.url)
    );
  }

  // Handle new images
  if (req.files && req.files.length > 0) {
    const product = await Product.findById(productId, 'name');
    const newImages = [];
    
    for (const file of req.files) {
      try {
        const result = await uploadImage(file, 'variants');
        newImages.push({
          url: result.url,
          altText: `${product.name} - ${name || variant.name}`
        });
      } catch (error) {
        throw new ApiError(`Image upload failed: ${error.message}`, 500);
      }
    }
    
    // Add new images to existing ones
    if (updateData.images) {
      updateData.images = [...updateData.images, ...newImages];
    } else {
      updateData.images = [...(variant.images || []), ...newImages];
    }
  }

  // Update the variant
  const updatedVariant = await ProductVariant.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  return ApiResponse.success(res, { variant: updatedVariant });
});

/**
 * @desc    Delete a product variant (soft delete)
 * @route   DELETE /api/products/:productId/variants/:id
 * @access  Private (Admin)
 */
exports.deleteProductVariant = asyncHandler(async (req, res) => {
  const { productId, id } = req.params;

  // Find the variant
  const variant = await ProductVariant.findOne({ 
    _id: id, 
    productId 
  });

  if (!variant) {
    throw new ApiError('Product variant not found', 404);
  }

  // Soft delete
  variant.isDeleted = true;
  await variant.save();

  return ApiResponse.success(res, null, 'Product variant deleted successfully');
});

/**
 * @desc    Restore a deleted product variant
 * @route   PUT /api/products/:productId/variants/:id/restore
 * @access  Private (Admin)
 */
exports.restoreProductVariant = asyncHandler(async (req, res) => {
  const { productId, id } = req.params;

  // Find the variant with includeDeleted option
  const variant = await ProductVariant.findOne({ 
    _id: id, 
    productId,
    isDeleted: true 
  });
  
  if (!variant) {
    throw new ApiError('Deleted product variant not found', 404);
  }

  // Restore the variant
  variant.isDeleted = false;
  await variant.save();

  return ApiResponse.success(res, { variant }, 'Product variant restored successfully');
});