// controllers/product-variant.controller.js
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const imageService = require('../utils/imageService');
const { getFileUrl } = require('../middlewares/upload.middleware');
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

// controllers/product-variant.controller.js - Fixed Create and Update methods

/**
 * @desc    Create a new product variant
 * @route   POST /api/products/:productId/variants
 * @access  Private (Admin, Staff)
 */
exports.createProductVariant = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  console.log('Create product variant - received data:', {
    productId,
    body: req.body,
    files: req.files ? req.files.map(f => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      key: f.key,
      location: f.location,
      path: f.path
    })) : null
  });

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
    isActive: isActive !== 'false' && isActive !== false,
    ...otherFields
  };

  // Handle multiple image uploads
  if (req.files && req.files.length > 0) {
    const images = [];
    
    console.log(`Processing ${req.files.length} uploaded variant images...`);
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        // Validate each image
        const validation = imageService.validateImage(file);
        if (!validation.isValid) {
          throw new ApiError(`Image ${i + 1} validation failed: ${validation.errors.join(', ')}`, 400);
        }

        // Process image using imageService
        const result = await imageService.uploadImage(file, 'variants');
        
        images.push({
          url: result.url,
          path: result.path,
          altText: `${product.name} - ${name}`,
          isDefault: i === 0, // First image is default
          sortOrder: i
        });
        
        console.log(`Variant image ${i + 1} processed successfully:`, {
          url: result.url,
          path: result.path
        });
        
      } catch (error) {
        console.error(`Variant image ${i + 1} upload error:`, error);
        
        // Clean up previously uploaded images if any fail
        for (const uploadedImage of images) {
          await imageService.deleteImage(uploadedImage.path);
        }
        
        throw new ApiError(`Image ${i + 1} upload failed: ${error.message}`, 500);
      }
    }
    
    variantData.images = images;
    console.log(`All ${images.length} variant images processed successfully`);
  }

  try {
    // Create the variant
    const variant = await ProductVariant.create(variantData);
    
    console.log('Product variant created successfully:', {
      id: variant._id,
      name: variant.name,
      productId: variant.productId,
      imagesCount: variant.images?.length || 0
    });

    return ApiResponse.created(res, { variant });
  } catch (error) {
    // If variant creation fails and we uploaded images, clean them up
    if (variantData.images && variantData.images.length > 0) {
      console.log('Cleaning up uploaded variant images due to creation failure...');
      for (const image of variantData.images) {
        await imageService.deleteImage(image.path);
      }
    }
    throw error;
  }
});

/**
 * @desc    Update a product variant
 * @route   PUT /api/products/:productId/variants/:id
 * @access  Private (Admin, Staff)
 */
exports.updateProductVariant = asyncHandler(async (req, res) => {
  const { productId, id } = req.params;
  
  console.log('Update product variant - received data:', {
    productId,
    variantId: id,
    body: req.body,
    files: req.files ? req.files.map(f => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      key: f.key,
      location: f.location,
      path: f.path
    })) : null
  });

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
  const updateData = {};
  
  // Update fields if provided
  if (name) updateData.name = name;
  if (sku) updateData.sku = sku;
  if (color !== undefined) updateData.color = color;
  if (size !== undefined) updateData.size = size;
  if (material !== undefined) updateData.material = material;
  if (priceAdjustment !== undefined) updateData.priceAdjustment = Number(priceAdjustment);
  if (stockQuantity !== undefined) updateData.stockQuantity = Number(stockQuantity);
  if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
  if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
  
  // Add other fields
  Object.assign(updateData, otherFields);

  // Store current images for potential cleanup
  const currentImages = variant.images || [];
  let imagesToDelete = [];

  // Handle image removal if specified
  if (removeImages) {
    const imagesToRemove = Array.isArray(removeImages) 
      ? removeImages 
      : [removeImages];
    
    console.log('Removing variant images:', imagesToRemove);
    
    // Find images to delete
    imagesToDelete = currentImages.filter(image => 
      imagesToRemove.includes(image.url) || imagesToRemove.includes(image.path)
    );
    
    // Update the images array (remove specified images)
    updateData.images = currentImages.filter(image => 
      !imagesToRemove.includes(image.url) && !imagesToRemove.includes(image.path)
    );
  }

  // Handle new image uploads
  if (req.files && req.files.length > 0) {
    const product = await Product.findById(productId, 'name');
    const newImages = [];
    
    console.log(`Processing ${req.files.length} new variant images...`);
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        // Validate each image
        const validation = imageService.validateImage(file);
        if (!validation.isValid) {
          throw new ApiError(`Image ${i + 1} validation failed: ${validation.errors.join(', ')}`, 400);
        }

        // Process image using imageService
        const result = await imageService.uploadImage(file, 'variants');
        
        const existingImagesCount = updateData.images ? updateData.images.length : currentImages.length;
        
        newImages.push({
          url: result.url,
          path: result.path,
          altText: `${product.name} - ${name || variant.name}`,
          isDefault: existingImagesCount === 0 && i === 0, // First image is default if no existing images
          sortOrder: existingImagesCount + i
        });
        
        console.log(`New variant image ${i + 1} processed successfully:`, {
          url: result.url,
          path: result.path
        });
        
      } catch (error) {
        console.error(`New variant image ${i + 1} upload error:`, error);
        
        // Clean up any successfully uploaded new images
        for (const uploadedImage of newImages) {
          await imageService.deleteImage(uploadedImage.path);
        }
        
        throw new ApiError(`Image ${i + 1} upload failed: ${error.message}`, 500);
      }
    }
    
    // Add new images to existing ones (or to the filtered list if removing images)
    if (updateData.images) {
      updateData.images = [...updateData.images, ...newImages];
    } else {
      updateData.images = [...currentImages, ...newImages];
    }
    
    console.log(`All ${newImages.length} new variant images processed successfully`);
  }

  try {
    // Update the variant
    const updatedVariant = await ProductVariant.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Delete removed images after successful update
    if (imagesToDelete.length > 0) {
      console.log(`Deleting ${imagesToDelete.length} removed variant images...`);
      for (const image of imagesToDelete) {
        try {
          await imageService.deleteImage(image.path || image.url);
          console.log('Variant image deleted successfully:', image.path || image.url);
        } catch (error) {
          console.error(`Failed to delete variant image ${image.path || image.url}:`, error.message);
          // Continue with other images even if one fails
        }
      }
    }

    console.log('Product variant updated successfully:', {
      id: updatedVariant._id,
      name: updatedVariant.name,
      imagesCount: updatedVariant.images?.length || 0
    });

    return ApiResponse.success(res, { variant: updatedVariant });
  } catch (error) {
    // If update fails and we uploaded new images, clean them up
    if (req.files && updateData.images) {
      const newImagePaths = updateData.images
        .slice(-(req.files.length))
        .map(img => img.path);
      
      console.log('Cleaning up new variant images due to update failure...');
      for (const imagePath of newImagePaths) {
        await imageService.deleteImage(imagePath);
      }
    }
    throw error;
  }
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