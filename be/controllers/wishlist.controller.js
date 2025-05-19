// controllers/wishlist.controller.js
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/async.middleware');

/**
 * @desc    Get user's wishlist
 * @route   GET /api/wishlist
 * @access  Private
 */
exports.getWishlist = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  
  // Count total items
  const total = await Wishlist.countDocuments({ userId: req.user._id });
  
  // Get paginated wishlist items
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const totalPages = Math.ceil(total / parseInt(limit));
  
  // Get wishlist items with product details
  const wishlistItems = await Wishlist.find({ userId: req.user._id })
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .populate({
      path: 'productId',
      select: 'name slug images basePrice description stockQuantity averageRating isDeleted'
    })
    .populate({
      path: 'variantId',
      select: 'name sku color size material priceAdjustment stockQuantity images isDeleted'
    });
  
  // Filter out deleted products
  const availableItems = wishlistItems.filter(item => 
    item.productId && !item.productId.isDeleted &&
    (!item.variantId || !item.variantId.isDeleted)
  );
  
  return ApiResponse.success(res, {
    wishlistItems: availableItems,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      limit: parseInt(limit)
    }
  });
});

/**
 * @desc    Add product to wishlist
 * @route   POST /api/wishlist
 * @access  Private
 */
exports.addToWishlist = asyncHandler(async (req, res) => {
  const { productId, variantId, note } = req.body;
  
  // Validate required fields
  if (!productId) {
    throw new ApiError('Product ID is required', 400);
  }
  
  // Validate product exists
  const product = await Product.findOne({
    _id: productId,
    isDeleted: false
  });
  
  if (!product) {
    throw new ApiError('Product not found or no longer available', 404);
  }
  
  // Validate variant if provided
  if (variantId) {
    const variant = await ProductVariant.findOne({
      _id: variantId,
      productId,
      isDeleted: false
    });
    
    if (!variant) {
      throw new ApiError('Product variant not found or no longer available', 404);
    }
  }
  
  // Check if already in wishlist
  const existingItem = await Wishlist.findOne({
    userId: req.user._id,
    productId,
    variantId: variantId || null
  });
  
  if (existingItem) {
    // Update note if provided
    if (note) {
      existingItem.note = note;
      await existingItem.save();
    }
    
    return ApiResponse.success(res, { wishlistItem: existingItem }, 'Product already in wishlist');
  }
  
  // Add to wishlist
  const wishlistItem = await Wishlist.create({
    userId: req.user._id,
    productId,
    variantId: variantId || null,
    note: note || ''
  });
  
  // Populate for response
  await wishlistItem.populate([
    {
      path: 'productId',
      select: 'name slug images basePrice description stockQuantity averageRating'
    },
    {
      path: 'variantId',
      select: 'name sku color size material priceAdjustment stockQuantity images'
    }
  ]);
  
  return ApiResponse.created(res, { wishlistItem }, 'Product added to wishlist');
});

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/wishlist/:id
 * @access  Private
 */
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Find wishlist item
  const wishlistItem = await Wishlist.findById(id);
  
  if (!wishlistItem) {
    throw new ApiError('Wishlist item not found', 404);
  }
  
  // Check if item belongs to user
  if (wishlistItem.userId.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to access this wishlist item', 403);
  }
  
  // Delete item
  await Wishlist.deleteOne({ _id: id });
  
  return ApiResponse.success(res, null, 'Product removed from wishlist');
});

/**
 * @desc    Toggle product in wishlist (add/remove)
 * @route   POST /api/wishlist/toggle
 * @access  Private
 */
exports.toggleWishlistItem = asyncHandler(async (req, res) => {
  const { productId, variantId, note } = req.body;
  
  // Validate required fields
  if (!productId) {
    throw new ApiError('Product ID is required', 400);
  }
  
  // Toggle item in wishlist
  try {
    const result = await Wishlist.toggleWishlistItem(
      req.user._id,
      productId,
      variantId || null,
      note || ''
    );
    
    // Populate for response
    if (result.action === 'added') {
      await result.wishlistItem.populate([
        {
          path: 'productId',
          select: 'name slug images basePrice description stockQuantity averageRating'
        },
        {
          path: 'variantId',
          select: 'name sku color size material priceAdjustment stockQuantity images'
        }
      ]);
    }
    
    const message = result.action === 'added' 
      ? 'Product added to wishlist' 
      : 'Product removed from wishlist';
    
    return ApiResponse.success(res, { 
      result,
      inWishlist: result.action === 'added'
    }, message);
  } catch (error) {
    throw new ApiError(`Failed to toggle wishlist item: ${error.message}`, 500);
  }
});

/**
 * @desc    Check if product is in wishlist
 * @route   GET /api/wishlist/check/:productId
 * @access  Private
 */
exports.checkWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { variantId } = req.query;
  
  // Check if in wishlist
  try {
    const inWishlist = await Wishlist.isProductInWishlist(
      req.user._id,
      productId,
      variantId || null
    );
    
    return ApiResponse.success(res, { inWishlist });
  } catch (error) {
    throw new ApiError(`Failed to check wishlist: ${error.message}`, 500);
  }
});

/**
 * @desc    Clear wishlist
 * @route   DELETE /api/wishlist
 * @access  Private
 */
exports.clearWishlist = asyncHandler(async (req, res) => {
  // Delete all wishlist items for user
  await Wishlist.deleteMany({ userId: req.user._id });
  
  return ApiResponse.success(res, null, 'Wishlist cleared successfully');
});

/**
 * @desc    Update wishlist item note
 * @route   PUT /api/wishlist/:id
 * @access  Private
 */
exports.updateWishlistItemNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  
  // Find wishlist item
  const wishlistItem = await Wishlist.findById(id);
  
  if (!wishlistItem) {
    throw new ApiError('Wishlist item not found', 404);
  }
  
  // Check if item belongs to user
  if (wishlistItem.userId.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to update this wishlist item', 403);
  }
  
  // Update note
  wishlistItem.note = note || '';
  await wishlistItem.save();
  
  // Populate for response
  await wishlistItem.populate([
    {
      path: 'productId',
      select: 'name slug images basePrice description stockQuantity averageRating'
    },
    {
      path: 'variantId',
      select: 'name sku color size material priceAdjustment stockQuantity images'
    }
  ]);
  
  return ApiResponse.success(res, { wishlistItem }, 'Wishlist item updated');
});

/**
 * @desc    Move wishlist item to cart
 * @route   POST /api/wishlist/:id/move-to-cart
 * @access  Private
 */
exports.moveToCart = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity = 1 } = req.body;
  
  // Find wishlist item
  const wishlistItem = await Wishlist.findById(id)
    .populate('productId')
    .populate('variantId');
  
  if (!wishlistItem) {
    throw new ApiError('Wishlist item not found', 404);
  }
  
  // Check if item belongs to user
  if (wishlistItem.userId.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to access this wishlist item', 403);
  }
  
  // Check if product still exists
  if (!wishlistItem.productId || wishlistItem.productId.isDeleted) {
    throw new ApiError('Product is no longer available', 404);
  }
  
  // Check variant if exists
  if (wishlistItem.variantId && (!wishlistItem.variantId || wishlistItem.variantId.isDeleted)) {
    throw new ApiError('Product variant is no longer available', 404);
  }
  
  // Find or create user's cart
  const Cart = require('../models/Cart');
  let cart = await Cart.findOne({ 
    userId: req.user._id,
    status: 'active'
  });
  
  if (!cart) {
    cart = await Cart.create({
      userId: req.user._id,
      status: 'active'
    });
  }
  
  // Check if product is already in cart
  const CartItem = require('../models/CartItem');
  const existingCartItem = await CartItem.findOne({
    cartId: cart._id,
    productId: wishlistItem.productId._id,
    variantId: wishlistItem.variantId ? wishlistItem.variantId._id : null
  });
  
  if (existingCartItem) {
    // Update quantity
    existingCartItem.quantity += parseInt(quantity, 10);
    await existingCartItem.save();
    
    // Remove from wishlist
    await Wishlist.deleteOne({ _id: id });
    
    return ApiResponse.success(res, { 
      cartItem: existingCartItem,
      cart: {
        _id: cart._id,
        subtotal: cart.subtotal
      }
    }, 'Item moved to cart and quantity updated');
  } else {
    // Calculate price
    let price = wishlistItem.productId.basePrice;
    
    if (wishlistItem.variantId) {
      price += wishlistItem.variantId.priceAdjustment || 0;
    }
    
    // Add to cart
    const cartItem = await CartItem.create({
      cartId: cart._id,
      productId: wishlistItem.productId._id,
      variantId: wishlistItem.variantId ? wishlistItem.variantId._id : null,
      quantity: parseInt(quantity, 10),
      price,
      notes: wishlistItem.note || ''
    });
    
    // Recalculate cart totals
    await cart.calculateTotals();
    
    // Remove from wishlist
    await Wishlist.deleteOne({ _id: id });
    
    return ApiResponse.success(res, { 
      cartItem,
      cart: {
        _id: cart._id,
        subtotal: cart.subtotal
      }
    }, 'Item moved to cart');
  }
});