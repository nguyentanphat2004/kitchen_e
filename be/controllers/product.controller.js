// controllers/product.controller.js
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Category = require('../models/Category');
const Review = require('../models/Review');
const FlashSaleItem = require('../models/FlashSaleItem');
const imageService = require('../utils/imageService');
const { getFileUrl } = require('../middlewares/upload.middleware');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/async.middleware');
const mongoose = require('mongoose');

/**
 * @desc    Get all products with pagination, filtering, and sorting
 * @route   GET /api/products
 * @access  Public
 */
exports.getProducts = asyncHandler(async (req, res) => {
  // Extract query parameters
  const {
    page = 1,
    limit = 12,
    sort = '-createdAt',
    category,
    search,
    minPrice,
    maxPrice,
    inStock,
    featured,
    variants,
    ...otherFilters
  } = req.query;

  // Build the query
  const query = { isDeleted: false };

  // Category filter - support both ID and slug
  if (category) {
    let categoryObj;
    
    // Check if category is an ID or slug
    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryObj = await Category.findById(category);
    } else {
      categoryObj = await Category.findOne({ slug: category });
    }
    
    if (categoryObj) {
      // Get all subcategories
      const subcategories = await Category.find({ parentId: categoryObj._id });
      const categoryIds = [
        categoryObj._id, 
        ...subcategories.map(subcat => subcat._id)
      ];
      
      query.categoryId = { $in: categoryIds };
    }
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.basePrice = {};
    if (minPrice) query.basePrice.$gte = Number(minPrice);
    if (maxPrice) query.basePrice.$lte = Number(maxPrice);
  }

  // In stock filter
  if (inStock === 'true') {
    query.stockQuantity = { $gt: 0 };
  }

  // Featured filter
  if (featured === 'true') {
    query.featured = true;
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Add other filters dynamically
  for (const key in otherFilters) {
    query[key] = otherFilters[key];
  }

  // Prepare the options for pagination
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
    populate: [
      { path: 'categoryId', select: 'name slug' }
    ]
  };

  // If variants flag is set, also populate variants
  if (variants === 'true') {
    options.populate.push({ path: 'variants' });
  }

  // Execute the query with pagination
  const products = await Product.paginate(query, options);

  // Check for active flash sales on these products
  const productIds = products.docs.map(product => product._id);
  const now = new Date();
  
  const flashSaleItems = await FlashSaleItem.find({
    productId: { $in: productIds },
    isActive: true
  }).populate({
    path: 'flashSaleId',
    match: { 
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: 'active',
      isActive: true
    }
  });

  // Map flash sale data to products
  const productsWithFlashSale = products.docs.map(product => {
    const productObj = product.toObject();
    
    const flashSaleItem = flashSaleItems.find(
      item => item.productId.toString() === productObj._id.toString() && item.flashSaleId
    );
    
    if (flashSaleItem) {
      productObj.flashSale = {
        discountPercent: flashSaleItem.discountPercent,
        discountedPrice: flashSaleItem.discountedPrice,
        flashSaleId: flashSaleItem.flashSaleId._id,
        endDate: flashSaleItem.flashSaleId.endDate
      };
    }
    
    return productObj;
  });
  
  // Format the response
  return ApiResponse.success(res, {
    products: productsWithFlashSale,
    pagination: {
      currentPage: products.page,
      totalPages: products.totalPages,
      totalItems: products.totalDocs,
      limit: products.limit
    }
  });
});

/**
 * @desc    Get a single product by ID or slug
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let product;

  // Check if id is a valid ObjectId or a slug
  if (mongoose.Types.ObjectId.isValid(id)) {
    product = await Product.findById(id);
  } else {
    product = await Product.findOne({ slug: id });
  }

  if (!product || product.isDeleted) {
    throw new ApiError('Product not found', 404);
  }

  // Populate related data
  await product.populate([
    { path: 'categoryId', select: 'name slug parentId' },
    { path: 'variants' }
  ]);

  // Get reviews
  const reviews = await Review.find({ 
    productId: product._id, 
    isApproved: true,
    isDeleted: false 
  })
  .sort('-createdAt')
  .limit(5)
  .populate('userId', 'firstName lastName username');

  // Check for active flash sale
  const now = new Date();
  const flashSaleItem = await FlashSaleItem.findOne({
    productId: product._id,
    isActive: true
  }).populate({
    path: 'flashSaleId',
    match: { 
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: 'active',
      isActive: true
    }
  });

  // Convert to plain object for modifications
  const productObj = product.toObject();
  
  // Add reviews
  productObj.reviews = reviews;
  
  // Add flash sale data if available
  if (flashSaleItem && flashSaleItem.flashSaleId) {
    productObj.flashSale = {
      discountPercent: flashSaleItem.discountPercent,
      discountedPrice: flashSaleItem.discountedPrice,
      flashSaleId: flashSaleItem.flashSaleId._id,
      endDate: flashSaleItem.flashSaleId.endDate
    };
  }

  // Get related products from same category
  const relatedProducts = await Product.find({ 
    categoryId: product.categoryId._id,
    _id: { $ne: product._id },
    isDeleted: false
  })
  .select('name slug basePrice images averageRating')
  .limit(4);
  
  productObj.relatedProducts = relatedProducts;

  return ApiResponse.success(res, { product: productObj });
});

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private (Admin, Staff)
 */
exports.createProduct = asyncHandler(async (req, res) => {
  console.log('Create product - received data:', {
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
    description,
    categoryId,
    basePrice,
    sku,
    stockQuantity,
    isCustomizable,
    tags,
    featured,
    dimensions,
    weight,
    ...otherFields
  } = req.body;

  // Validate required fields
  if (!name || !description || !categoryId || !basePrice || !sku) {
    throw new ApiError('Please provide all required fields', 400);
  }

  // Validate category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError('Category not found', 404);
  }

  // Check if SKU is unique
  const existingSku = await Product.findOne({ sku });
  if (existingSku) {
    throw new ApiError('SKU already exists', 400);
  }

  // Process tags if provided as a string
  let processedTags = tags;
  if (typeof tags === 'string') {
    processedTags = tags.split(',').map(tag => tag.trim());
  }

  // Create product object
  const productData = {
    name,
    description,
    categoryId,
    basePrice: Number(basePrice),
    sku,
    stockQuantity: stockQuantity ? Number(stockQuantity) : 0,
    isCustomizable: isCustomizable === 'true' || isCustomizable === true,
    tags: processedTags || [],
    featured: featured === 'true' || featured === true,
    ...otherFields
  };

  // Add dimensions if provided
  if (dimensions) {
    try {
      productData.dimensions = typeof dimensions === 'string' 
        ? JSON.parse(dimensions) 
        : dimensions;
    } catch (error) {
      throw new ApiError('Invalid dimensions format', 400);
    }
  }

  // Add weight if provided
  if (weight) {
    productData.weight = Number(weight);
  }

  // Handle multiple image uploads
  if (req.files && req.files.length > 0) {
    const images = [];
    
    console.log(`Processing ${req.files.length} uploaded images...`);
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        // Validate each image
        const validation = imageService.validateImage(file);
        if (!validation.isValid) {
          throw new ApiError(`Image ${i + 1} validation failed: ${validation.errors.join(', ')}`, 400);
        }

        // Process image using imageService
        const result = await imageService.uploadImage(file, 'products');
        
        images.push({
          url: result.url,
          path: result.path,
          altText: name,
          isDefault: i === 0, // First image is default
          sortOrder: i
        });
        
        console.log(`Image ${i + 1} processed successfully:`, {
          url: result.url,
          path: result.path
        });
        
      } catch (error) {
        console.error(`Image ${i + 1} upload error:`, error);
        
        // Clean up previously uploaded images if any fail
        for (const uploadedImage of images) {
          await imageService.deleteImage(uploadedImage.path);
        }
        
        throw new ApiError(`Image ${i + 1} upload failed: ${error.message}`, 500);
      }
    }
    
    productData.images = images;
    console.log(`All ${images.length} images processed successfully`);
  }

  try {
    // Create the product
    const product = await Product.create(productData);
    
    console.log('Product created successfully:', {
      id: product._id,
      name: product.name,
      imagesCount: product.images?.length || 0
    });

    return ApiResponse.created(res, { product });
  } catch (error) {
    // If product creation fails and we uploaded images, clean them up
    if (productData.images && productData.images.length > 0) {
      console.log('Cleaning up uploaded images due to product creation failure...');
      for (const image of productData.images) {
        await imageService.deleteImage(image.path);
      }
    }
    throw error;
  }
});

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private (Admin, Staff)
 */
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('Update product - received data:', {
    id,
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
    description,
    categoryId,
    basePrice,
    sku,
    stockQuantity,
    isCustomizable,
    tags,
    featured,
    dimensions,
    weight,
    removeImages,
    ...otherFields
  } = req.body;

  // Find the product
  const product = await Product.findById(id);
  if (!product || product.isDeleted) {
    throw new ApiError('Product not found', 404);
  }

  // Validate category if provided
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new ApiError('Category not found', 404);
    }
  }

  // Check SKU uniqueness if changed
  if (sku && sku !== product.sku) {
    const existingSku = await Product.findOne({ sku, _id: { $ne: id } });
    if (existingSku) {
      throw new ApiError('SKU already exists', 400);
    }
  }

  // Process tags if provided
  let processedTags = tags;
  if (typeof tags === 'string') {
    processedTags = tags.split(',').map(tag => tag.trim());
  }

  // Create update object
  const updateData = {};
  
  // Update fields if provided
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (categoryId) updateData.categoryId = categoryId;
  if (basePrice) updateData.basePrice = Number(basePrice);
  if (sku) updateData.sku = sku;
  if (stockQuantity !== undefined) updateData.stockQuantity = Number(stockQuantity);
  if (isCustomizable !== undefined) {
    updateData.isCustomizable = isCustomizable === 'true' || isCustomizable === true;
  }
  if (processedTags) updateData.tags = processedTags;
  if (featured !== undefined) {
    updateData.featured = featured === 'true' || featured === true;
  }
  
  // Add other fields
  Object.assign(updateData, otherFields);

  // Handle dimensions if provided
  if (dimensions) {
    try {
      updateData.dimensions = typeof dimensions === 'string' 
        ? JSON.parse(dimensions) 
        : dimensions;
    } catch (error) {
      throw new ApiError('Invalid dimensions format', 400);
    }
  }

  // Handle weight if provided
  if (weight) {
    updateData.weight = Number(weight);
  }

  // Store current images for potential cleanup
  const currentImages = product.images || [];
  let imagesToDelete = [];

  // Handle image removal if specified
  if (removeImages) {
    const imagesToRemove = Array.isArray(removeImages) 
      ? removeImages 
      : [removeImages];
    
    console.log('Removing images:', imagesToRemove);
    
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
    const newImages = [];
    
    console.log(`Processing ${req.files.length} new uploaded images...`);
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        // Validate each image
        const validation = imageService.validateImage(file);
        if (!validation.isValid) {
          throw new ApiError(`Image ${i + 1} validation failed: ${validation.errors.join(', ')}`, 400);
        }

        // Process image using imageService
        const result = await imageService.uploadImage(file, 'products');
        
        const existingImagesCount = updateData.images ? updateData.images.length : currentImages.length;
        
        newImages.push({
          url: result.url,
          path: result.path,
          altText: name || product.name,
          isDefault: existingImagesCount === 0 && i === 0, // First image is default if no existing images
          sortOrder: existingImagesCount + i
        });
        
        console.log(`New image ${i + 1} processed successfully:`, {
          url: result.url,
          path: result.path
        });
        
      } catch (error) {
        console.error(`New image ${i + 1} upload error:`, error);
        
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
    
    console.log(`All ${newImages.length} new images processed successfully`);
  }

  try {
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Delete removed images after successful update
    if (imagesToDelete.length > 0) {
      console.log(`Deleting ${imagesToDelete.length} removed images...`);
      for (const image of imagesToDelete) {
        try {
          await imageService.deleteImage(image.path || image.url);
          console.log('Image deleted successfully:', image.path || image.url);
        } catch (error) {
          console.error(`Failed to delete image ${image.path || image.url}:`, error.message);
          // Continue with other images even if one fails
        }
      }
    }

    console.log('Product updated successfully:', {
      id: updatedProduct._id,
      name: updatedProduct.name,
      imagesCount: updatedProduct.images?.length || 0
    });

    return ApiResponse.success(res, { product: updatedProduct });
  } catch (error) {
    // If update fails and we uploaded new images, clean them up
    if (req.files && updateData.images) {
      const newImagePaths = updateData.images
        .slice(-(req.files.length))
        .map(img => img.path);
      
      console.log('Cleaning up new images due to update failure...');
      for (const imagePath of newImagePaths) {
        await imageService.deleteImage(imagePath);
      }
    }
    throw error;
  }
});

/**
 * @desc    Delete a product (soft delete)
 * @route   DELETE /api/products/:id
 * @access  Private (Admin)
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the product
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  // Soft delete
  product.isDeleted = true;
  await product.save();

  return ApiResponse.success(res, null, 'Product deleted successfully');
});

/**
 * @desc    Restore a deleted product
 * @route   PUT /api/products/:id/restore
 * @access  Private (Admin)
 */
exports.restoreProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the product with includeDeleted option
  const product = await Product.findOne({ _id: id, isDeleted: true });
  
  if (!product) {
    throw new ApiError('Deleted product not found', 404);
  }

  // Restore the product
  product.isDeleted = false;
  await product.save();

  return ApiResponse.success(res, { product }, 'Product restored successfully');
});

/**
 * @desc    Search products
 * @route   GET /api/products/search
 * @access  Public
 */
exports.searchProducts = asyncHandler(async (req, res) => {
  const { query, limit = 10 } = req.query;

  if (!query) {
    throw new ApiError('Search query is required', 400);
  }

  // Search products using text index
  const products = await Product.find(
    { 
      $text: { $search: query },
      isDeleted: false
    },
    { score: { $meta: 'textScore' } }
  )
    .select('name slug images basePrice averageRating')
    .sort({ score: { $meta: 'textScore' } })
    .limit(parseInt(limit));

  return ApiResponse.success(res, { 
    products,
    count: products.length,
    query
  });
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const products = await Product.find({ 
    featured: true,
    isDeleted: false,
    stockQuantity: { $gt: 0 }
  })
    .select('name slug images basePrice averageRating')
    .sort('-createdAt')
    .limit(parseInt(limit));

  return ApiResponse.success(res, { 
    products,
    count: products.length
  });
});

/**
 * @desc    Get best selling products
 * @route   GET /api/products/best-selling
 * @access  Public
 */
exports.getBestSellingProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  // In a real implementation, this would be based on OrderItem aggregation
  // For simplicity, we'll use a popularity field for now
  const products = await Product.find({ 
    isDeleted: false,
    stockQuantity: { $gt: 0 }
  })
    .select('name slug images basePrice averageRating popularity')
    .sort('-popularity -averageRating')
    .limit(parseInt(limit));

  return ApiResponse.success(res, { 
    products,
    count: products.length
  });
});