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
    stockQuantity: stockQuantity || 0,
    isCustomizable: isCustomizable === 'true' || isCustomizable === true,
    tags: processedTags || [],
    featured: featured === 'true' || featured === true,
    ...otherFields
  };

  // Add dimensions if provided
  if (dimensions) {
    productData.dimensions = dimensions;
  }

  // Add weight if provided
  if (weight) {
    productData.weight = Number(weight);
  }

  // Upload images if provided
  if (req.files && req.files.length > 0) {
    const images = [];
    
    for (const file of req.files) {
      try {
        // Sử dụng imageService mới để hỗ trợ cả local và S3
        const result = await imageService.uploadImage(file, 'products');
        images.push({
          url: result.url, // URL đã được tạo tương ứng với loại storage (S3 hoặc local)
          path: result.path, // Đường dẫn lưu trữ (key trong S3 hoặc đường dẫn local)
          altText: name,
          isDefault: images.length === 0 // First image is default
        });
      } catch (error) {
        throw new ApiError(`Image upload failed: ${error.message}`, 500);
      }
    }
    
    productData.images = images;
  }

  // Create the product
  const product = await Product.create(productData);

  return ApiResponse.created(res, { product });
});

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private (Admin, Staff)
 */
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
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
  const updateData = {
    ...(name && { name }),
    ...(description && { description }),
    ...(categoryId && { categoryId }),
    ...(basePrice && { basePrice: Number(basePrice) }),
    ...(sku && { sku }),
    ...(stockQuantity !== undefined && { stockQuantity: Number(stockQuantity) }),
    ...(isCustomizable !== undefined && { 
      isCustomizable: isCustomizable === 'true' || isCustomizable === true 
    }),
    ...(processedTags && { tags: processedTags }),
    ...(featured !== undefined && { 
      featured: featured === 'true' || featured === true 
    }),
    ...otherFields
  };

  // Add dimensions if provided
  if (dimensions) {
    updateData.dimensions = dimensions;
  }

  // Add weight if provided
  if (weight) {
    updateData.weight = Number(weight);
  }

  // Handle image removal if specified
  if (removeImages) {
    const imagesToRemove = Array.isArray(removeImages) 
      ? removeImages 
      : [removeImages];
    
    // Delete images from storage (works with both S3 and local)
    for (const image of product.images) {
      if (imagesToRemove.includes(image.url)) {
        try {
          // Sử dụng imageService mới để xóa hình ảnh
          await imageService.deleteImage(image.path || image.url);
        } catch (error) {
          console.error(`Failed to delete image ${image.url}: ${error.message}`);
          // Continue with other images even if one fails
        }
      }
    }
    
    // Update the images array
    updateData.images = product.images.filter(
      image => !imagesToRemove.includes(image.url)
    );
  }

  // Handle new images
  if (req.files && req.files.length > 0) {
    const newImages = [];
    
    for (const file of req.files) {
      try {
        // Sử dụng imageService mới để hỗ trợ cả local và S3
        const result = await imageService.uploadImage(file, 'products');
        newImages.push({
          url: result.url,
          path: result.path,
          altText: name || product.name,
          isDefault: !product.images || product.images.length === 0
        });
      } catch (error) {
        throw new ApiError(`Image upload failed: ${error.message}`, 500);
      }
    }
    
    // Add new images to existing ones
    if (updateData.images) {
      updateData.images = [...updateData.images, ...newImages];
    } else {
      updateData.images = [...(product.images || []), ...newImages];
    }
  }

  // Update the product
  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  return ApiResponse.success(res, { product: updatedProduct });
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