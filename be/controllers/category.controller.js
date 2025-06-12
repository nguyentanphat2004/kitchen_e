// controllers/category.controller.js
const Category = require('../models/Category');
const Product = require('../models/Product');
const imageService = require('../utils/imageService');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/async.middleware');
const mongoose = require('mongoose');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
exports.getCategories = asyncHandler(async (req, res) => {
  const { 
    flat = false, 
    featured, 
    parent,
    includeProducts,
    page,
    limit = 20,
    ...otherFilters
  } = req.query;

  // Build query
  const query = { isDeleted: false };

  // Filter by featured
  if (featured === 'true') {
    query.featured = true;
  }

  // Filter by parent category
  if (parent === 'null' || parent === 'root') {
    query.parentId = null;
  } else if (parent) {
    query.parentId = parent;
  }

  // Add other filters
  for (const key in otherFilters) {
    query[key] = otherFilters[key];
  }

  // Check if pagination is requested
  if (page) {
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      sort: 'displayOrder name',
      populate: {
        path: 'productsCount'
      }
    };

    // Add subcategories if not flat view
    if (flat !== 'true') {
      options.populate.push({
        path: 'subcategories',
        select: 'name slug image',
        populate: {
          path: 'productsCount'
        }
      });
    }

    // Add products count if requested
    if (includeProducts === 'true') {
      options.populate.push('productsCount');
    }

    // Execute paginated query
    const categories = await Category.paginate(query, options);

    return ApiResponse.success(res, {
      categories: categories.docs,
      pagination: {
        currentPage: categories.page,
        totalPages: categories.totalPages,
        totalItems: categories.totalDocs,
        limit: categories.limit
      }
    });
  } else {
    // Execute regular query
    let categories;

    if (flat === 'true') {
      // Flat list - no hierarchy
      categories = await Category.find(query)
        .sort('displayOrder name')
        .populate('productsCount');
    } else {
      // Return hierarchical structure
      categories = await Category.getHierarchy();
    }

    return ApiResponse.success(res, { categories });
  }
});

/**
 * @desc    Get a single category
 * @route   GET /api/categories/:id
 * @access  Public
 */
exports.getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { includeProducts, productsLimit = 10 } = req.query;
  
  let category;
  
  // Check if id is a valid ObjectId or a slug
  if (mongoose.Types.ObjectId.isValid(id)) {
    category = await Category.findById(id);
  } else {
    category = await Category.findOne({ slug: id });
  }
  
  if (!category || category.isDeleted) {
    throw new ApiError('Category not found', 404);
  }
  
  // Populate subcategories
  await category.populate({
    path: 'subcategories',
    select: 'name slug image',
    populate: {
      path: 'productsCount'
    }
  });
  
  // Populate products count
  await category.populate('productsCount');
  
  // Include products if requested
  if (includeProducts === 'true') {
    const products = await Product.find({
      categoryId: category._id,
      isDeleted: false
    })
      .select('name slug images basePrice averageRating')
      .sort('-createdAt')
      .limit(parseInt(productsLimit, 10));
      
    // Convert to plain object for adding products
    const categoryObj = category.toObject();
    categoryObj.products = products;
    
    return ApiResponse.success(res, { category: categoryObj });
  }
  
  return ApiResponse.success(res, { category });
});

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private (Admin, Staff)
 */
exports.createCategory = asyncHandler(async (req, res) => {
  console.log('Create category - received data:', {
    body: req.body,
    file: req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      key: req.file.key,
      location: req.file.location,
      path: req.file.path
    } : null
  });

  const {
    name,
    description,
    parentId,
    displayOrder,
    featured,
    showInMenu,
    showInHome,
    isActive,
    icon,
    metaTitle,
    metaDescription,
    metaKeywords,
    ...otherFields
  } = req.body;
  
  // Validate required fields
  if (!name) {
    throw new ApiError('Category name is required', 400);
  }
  
  // Create category object
  const categoryData = {
    name,
    description: description || '',
    parentId: parentId === 'null' || parentId === '' ? null : parentId,
    displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
    featured: featured === 'true' || featured === true,
    showInMenu: showInMenu !== 'false' && showInMenu !== false,
    showInHome: showInHome === 'true' || showInHome === true,
    isActive: isActive !== 'false' && isActive !== false,
    icon: icon || null,
    metaTitle: metaTitle || name,
    metaDescription: metaDescription || description || '',
    metaKeywords: metaKeywords || '',
    ...otherFields
  };
  
  // Handle image upload if provided
  if (req.file) {
    try {
      console.log('Processing uploaded image...');
      
      // Validate image
      const validation = imageService.validateImage(req.file);
      if (!validation.isValid) {
        throw new ApiError(`Image validation failed: ${validation.errors.join(', ')}`, 400);
      }

      // Process image and get URLs
      const result = await imageService.uploadImage(req.file, 'categories');
      
      categoryData.image = result.url;
      categoryData.imagePath = result.path;
      
      console.log('Image processed successfully:', {
        url: result.url,
        path: result.path
      });
      
    } catch (error) {
      console.error('Image upload error:', error);
      throw new ApiError(`Image upload failed: ${error.message}`, 500);
    }
  }
  
  try {
    // Create the category
    const category = await Category.create(categoryData);
    
    console.log('Category created successfully:', {
      id: category._id,
      name: category.name,
      image: category.image
    });
    
    return ApiResponse.created(res, { category });
  } catch (error) {
    // If category creation fails and we uploaded an image, clean it up
    if (req.file && categoryData.imagePath) {
      await imageService.deleteImage(categoryData.imagePath);
    }
    throw error;
  }
});

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Private (Admin, Staff)
 */
exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('Update category - received data:', {
    id,
    body: req.body,
    file: req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      key: req.file.key,
      location: req.file.location,
      path: req.file.path
    } : null
  });

  const {
    name,
    description,
    parentId,
    displayOrder,
    featured,
    showInMenu,
    showInHome,
    isActive,
    icon,
    metaTitle,
    metaDescription,
    metaKeywords,
    removeImage,
    ...otherFields
  } = req.body;
  
  // Find the category
  const category = await Category.findById(id);
  if (!category || category.isDeleted) {
    throw new ApiError('Category not found', 404);
  }
  
  // Check for parent-child circular reference
  if (parentId && parentId !== 'null' && parentId !== null && parentId !== '') {
    // Ensure the parent category exists
    const parentCategory = await Category.findById(parentId);
    if (!parentCategory || parentCategory.isDeleted) {
      throw new ApiError('Parent category not found', 404);
    }
    
    // Check that the parent is not itself or its descendant
    if (parentId === id) {
      throw new ApiError('Category cannot be its own parent', 400);
    }
    
    // Check if the parent is a descendant of this category
    const isDescendant = await isDescendantOf(parentId, id);
    if (isDescendant) {
      throw new ApiError('Parent category cannot be a descendant of this category', 400);
    }
  }
  
  // Create update object
  const updateData = {};
  
  // Update fields if provided
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  
  // Handle parentId
  if (parentId === 'null' || parentId === '' || parentId === null) {
    updateData.parentId = null;
  } else if (parentId) {
    updateData.parentId = parentId;
  }
  
  if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder, 10);
  if (featured !== undefined) updateData.featured = featured === 'true' || featured === true;
  if (showInMenu !== undefined) updateData.showInMenu = showInMenu === 'true' || showInMenu === true;
  if (showInHome !== undefined) updateData.showInHome = showInHome === 'true' || showInHome === true;
  if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
  if (icon !== undefined) updateData.icon = icon;
  if (metaTitle) updateData.metaTitle = metaTitle;
  if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
  if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;
  
  // Add other fields
  Object.assign(updateData, otherFields);
  
  // Store old image info for cleanup
  const oldImagePath = category.imagePath || category.image;
  
  // Handle image removal if specified
  if (removeImage === 'true' && oldImagePath) {
    try {
      console.log('Removing current image:', oldImagePath);
      await imageService.deleteImage(oldImagePath);
      updateData.image = null;
      updateData.imagePath = null;
      console.log('Current image removed successfully');
    } catch (error) {
      console.error(`Failed to delete image: ${error.message}`);
      // Continue even if image deletion fails
    }
  }
  
  // Handle new image upload
  if (req.file) {
    try {
      console.log('Processing new uploaded image...');
      
      // Validate new image
      const validation = imageService.validateImage(req.file);
      if (!validation.isValid) {
        throw new ApiError(`Image validation failed: ${validation.errors.join(', ')}`, 400);
      }

      // Process new image
      const result = await imageService.uploadImage(req.file, 'categories');
      
      updateData.image = result.url;
      updateData.imagePath = result.path;
      
      console.log('New image processed successfully:', {
        url: result.url,
        path: result.path
      });
      
      // Delete old image if exists and we're replacing it
      if (oldImagePath && removeImage !== 'true') {
        try {
          await imageService.deleteImage(oldImagePath);
          console.log('Old image deleted successfully');
        } catch (error) {
          console.error(`Failed to delete old image: ${error.message}`);
          // Continue even if old image deletion fails
        }
      }
      
    } catch (error) {
      console.error('New image upload error:', error);
      throw new ApiError(`Image upload failed: ${error.message}`, 500);
    }
  }
  
  try {
    // Update the category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log('Category updated successfully:', {
      id: updatedCategory._id,
      name: updatedCategory.name,
      image: updatedCategory.image
    });
    
    return ApiResponse.success(res, { category: updatedCategory });
  } catch (error) {
    // If update fails and we uploaded a new image, clean it up
    if (req.file && updateData.imagePath) {
      await imageService.deleteImage(updateData.imagePath);
    }
    throw error;
  }
});

/**
 * @desc    Delete a category (soft delete)
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin)
 */
exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Find the category
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError('Category not found', 404);
  }
  
  // Check if this category has subcategories
  const subcategories = await Category.countDocuments({ parentId: id, isDeleted: false });
  if (subcategories > 0) {
    throw new ApiError('Cannot delete category with subcategories. Delete or reassign subcategories first.', 400);
  }
  
  // Check if this category has products
  const products = await Product.countDocuments({ categoryId: id, isDeleted: false });
  if (products > 0) {
    throw new ApiError('Cannot delete category with products. Reassign products to another category first.', 400);
  }
  
  // Soft delete
  category.isDeleted = true;
  await category.save();
  
  return ApiResponse.success(res, null, 'Category deleted successfully');
});

/**
 * @desc    Restore a deleted category
 * @route   PUT /api/categories/:id/restore
 * @access  Private (Admin)
 */
exports.restoreCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Find the deleted category
  const category = await Category.findOne({ _id: id, isDeleted: true });
  if (!category) {
    throw new ApiError('Deleted category not found', 404);
  }
  
  // Check if parent is deleted
  if (category.parentId) {
    const parent = await Category.findById(category.parentId);
    if (parent && parent.isDeleted) {
      throw new ApiError('Cannot restore category with deleted parent. Restore parent category first.', 400);
    }
  }
  
  // Restore category
  category.isDeleted = false;
  await category.save();
  
  return ApiResponse.success(res, { category }, 'Category restored successfully');
});

/**
 * @desc    Get products by category
 * @route   GET /api/categories/:id/products
 * @access  Public
 */
exports.getCategoryProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    page = 1, 
    limit = 12, 
    sort = '-createdAt',
    includeSubcategories = 'true',
    ...filters
  } = req.query;
  
  // Find the category
  let category;
  if (mongoose.Types.ObjectId.isValid(id)) {
    category = await Category.findById(id);
  } else {
    category = await Category.findOne({ slug: id });
  }
  
  if (!category || category.isDeleted) {
    throw new ApiError('Category not found', 404);
  }
  
  // Build query
  const query = {
    isDeleted: false
  };
  
  if (includeSubcategories === 'true') {
    // Get all subcategory IDs
    const subcategories = await Category.find({ parentId: category._id, isDeleted: false });
    const categoryIds = [
      category._id,
      ...subcategories.map(subcat => subcat._id)
    ];
    
    query.categoryId = { $in: categoryIds };
  } else {
    query.categoryId = category._id;
  }
  
  // Add other filters
  for (const key in filters) {
    query[key] = filters[key];
  }
  
  // Execute paginated query
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
    populate: [
      { path: 'categoryId', select: 'name slug' }
    ]
  };
  
  const products = await Product.paginate(query, options);
  
  return ApiResponse.success(res, {
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image
    },
    products: products.docs,
    pagination: {
      currentPage: products.page,
      totalPages: products.totalPages,
      totalItems: products.totalDocs,
      limit: products.limit
    }
  });
});

/**
 * @desc    Get featured categories
 * @route   GET /api/categories/featured
 * @access  Public
 */
exports.getFeaturedCategories = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  
  // Use the static method from the model
  const categories = await Category.getFeaturedCategories(parseInt(limit, 10));
  
  return ApiResponse.success(res, {
    categories,
    count: categories.length
  });
});

/**
 * @desc    Reorder categories
 * @route   PUT /api/categories/reorder
 * @access  Private (Admin, Staff)
 */
exports.reorderCategories = asyncHandler(async (req, res) => {
  const { categories } = req.body;
  
  if (!categories || !Array.isArray(categories)) {
    throw new ApiError('Categories array is required', 400);
  }
  
  // Update displayOrder for each category
  for (const item of categories) {
    if (!item.id || item.displayOrder === undefined) {
      throw new ApiError('Each item must have id and displayOrder', 400);
    }
    
    await Category.findByIdAndUpdate(
      item.id,
      { displayOrder: item.displayOrder }
    );
  }
  
  // Get updated categories
  const updatedCategories = await Category.find({ 
    _id: { $in: categories.map(item => item.id) }
  })
    .sort('displayOrder name')
    .select('name slug displayOrder');
  
  return ApiResponse.success(res, {
    categories: updatedCategories,
    message: 'Categories reordered successfully'
  });
});


async function isDescendantOf(categoryId, possibleParentId) {
  let current = await Category.findById(categoryId);
  
  if (!current || !current.parentId) {
    return false;
  }
  
  if (current.parentId.toString() === possibleParentId) {
    return true;
  }
  
  return isDescendantOf(current.parentId, possibleParentId);
}