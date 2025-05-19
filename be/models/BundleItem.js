// models/BundleItem.js
const mongoose = require('mongoose');

const BundleItemSchema = new mongoose.Schema(
  {
    bundleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bundle',
      required: [true, 'Bundle ID is required']
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
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    isRequired: {
      type: Boolean,
      default: true,
      description: 'Whether the item is required in a customizable bundle'
    },
    sortOrder: {
      type: Number,
      default: 0,
      description: 'Order to display items in the bundle'
    },
    customPrice: {
      type: Number,
      description: 'Custom price for this item in the bundle (overrides product price)'
    },
    alternativeIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Product',
      description: 'Alternative products that can be selected instead in customizable bundles'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Middleware to check if product exists and is active
BundleItemSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('productId') || this.isModified('variantId')) {
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
      
      // Check alternative products if provided
      if (this.alternativeIds && this.alternativeIds.length > 0) {
        const invalidAlternatives = [];
        
        for (const alternativeId of this.alternativeIds) {
          const alternative = await Product.findOne({
            _id: alternativeId,
            isDeleted: false
          });
          
          if (!alternative) {
            invalidAlternatives.push(alternativeId);
          }
        }
        
        if (invalidAlternatives.length > 0) {
          return next(new Error(`Some alternative products are not available: ${invalidAlternatives.join(', ')}`));
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

// After saving bundle item, update bundle prices
BundleItemSchema.post('save', async function() {
  try {
    const Bundle = mongoose.model('Bundle');
    const bundle = await Bundle.findById(this.bundleId);
    
    if (bundle) {
      await bundle.calculatePrices();
    }
  } catch (error) {
    console.error('Failed to update bundle prices:', error);
  }
});

// After updating bundle item, update bundle prices
BundleItemSchema.post('findOneAndUpdate', async function(doc) {
  try {
    if (doc) {
      const Bundle = mongoose.model('Bundle');
      const bundle = await Bundle.findById(doc.bundleId);
      
      if (bundle) {
        await bundle.calculatePrices();
      }
    }
  } catch (error) {
    console.error('Failed to update bundle prices after update:', error);
  }
});

// After deleting bundle item, update bundle prices
BundleItemSchema.post('findOneAndDelete', async function(doc) {
  try {
    if (doc) {
      const Bundle = mongoose.model('Bundle');
      const bundle = await Bundle.findById(doc.bundleId);
      
      if (bundle) {
        await bundle.calculatePrices();
      }
    }
  } catch (error) {
    console.error('Failed to update bundle prices after delete:', error);
  }
});

// Virtual for calculating item price
BundleItemSchema.virtual('price').get(async function() {
  try {
    // If custom price is set, use it
    if (this.customPrice !== undefined && this.customPrice !== null) {
      return this.customPrice;
    }
    
    // Otherwise calculate from product + variant
    const Product = mongoose.model('Product');
    const product = await Product.findById(this.productId);
    
    if (!product) {
      return 0;
    }
    
    let price = product.basePrice;
    
    if (this.variantId) {
      const ProductVariant = mongoose.model('ProductVariant');
      const variant = await ProductVariant.findById(this.variantId);
      
      if (variant) {
        price += variant.priceAdjustment;
      }
    }
    
    return price;
  } catch (error) {
    console.error('Error calculating bundle item price:', error);
    return 0;
  }
});

// Virtual for calculating total item price
BundleItemSchema.virtual('totalPrice').get(async function() {
  const price = await this.price;
  return price * this.quantity;
});

// Indexes for faster lookups
BundleItemSchema.index({ bundleId: 1, sortOrder: 1 });
BundleItemSchema.index({ productId: 1 });
BundleItemSchema.index({ bundleId: 1, productId: 1, variantId: 1 }, { unique: true });

module.exports = mongoose.model('BundleItem', BundleItemSchema);