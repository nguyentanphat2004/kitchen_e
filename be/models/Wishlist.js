// models/Wishlist.js
const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      default: null
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note cannot exceed 200 characters']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Middleware to check if product exists and is active
WishlistSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Check if product exists and is active
      const Product = mongoose.model('Product');
      const product = await Product.findOne({
        _id: this.productId,
        isDeleted: false
      });
      
      if (!product) {
        return next(new Error('Product not found or no longer available'));
      }
      
      // Check if variant exists if provided
      if (this.variantId) {
        const ProductVariant = mongoose.model('ProductVariant');
        const variant = await ProductVariant.findOne({
          _id: this.variantId,
          productId: this.productId,
          isDeleted: false
        });
        
        if (!variant) {
          return next(new Error('Product variant not found or no longer available'));
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Static method to get user's wishlist with product details
WishlistSchema.statics.getUserWishlist = async function(userId) {
  try {
    return await this.find({ userId })
      .populate({
        path: 'productId',
        select: 'name slug images basePrice averageRating description'
      })
      .populate({
        path: 'variantId',
        select: 'name color size material priceAdjustment'
      })
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Failed to get user wishlist: ${error.message}`);
  }
};

// Static method to check if product is in wishlist
WishlistSchema.statics.isProductInWishlist = async function(userId, productId, variantId = null) {
  try {
    const query = {
      userId,
      productId
    };
    
    if (variantId) {
      query.variantId = variantId;
    }
    
    const item = await this.findOne(query);
    return !!item;
  } catch (error) {
    throw new Error(`Failed to check wishlist: ${error.message}`);
  }
};

// Static method to toggle wishlist item
WishlistSchema.statics.toggleWishlistItem = async function(userId, productId, variantId = null, note = '') {
  try {
    const query = {
      userId,
      productId
    };
    
    if (variantId) {
      query.variantId = variantId;
    }
    
    // Check if item already exists in wishlist
    const existingItem = await this.findOne(query);
    
    if (existingItem) {
      // Remove item from wishlist
      await this.deleteOne({ _id: existingItem._id });
      return {
        action: 'removed',
        wishlistItem: existingItem
      };
    } else {
      // Add item to wishlist
      const newItem = await this.create({
        userId,
        productId,
        variantId,
        note
      });
      
      return {
        action: 'added',
        wishlistItem: newItem
      };
    }
  } catch (error) {
    throw new Error(`Failed to toggle wishlist item: ${error.message}`);
  }
};

// Enforce unique product per user
WishlistSchema.index(
  { userId: 1, productId: 1, variantId: 1 },
  { unique: true }
);

// Additional indexes for faster lookups
WishlistSchema.index({ userId: 1, createdAt: -1 });
WishlistSchema.index({ productId: 1 });

module.exports = mongoose.model('Wishlist', WishlistSchema);