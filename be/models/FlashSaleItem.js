// models/FlashSaleItem.js
const mongoose = require('mongoose');

const FlashSaleItemSchema = new mongoose.Schema(
  {
    flashSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlashSale',
      required: [true, 'Please provide a flash sale id']
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Please provide a product id']
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant'
    },
    discountPercent: {
      type: Number,
      required: [true, 'Please provide a discount percentage'],
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100']
    },
    discountedPrice: {
      type: Number,
      min: [0, 'Discounted price cannot be negative']
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide a quantity'],
      min: [0, 'Quantity cannot be negative']
    },
    quantitySold: {
      type: Number,
      default: 0,
      min: [0, 'Quantity sold cannot be negative']
    },
    maxPerCustomer: {
      type: Number,
      default: 0, // 0 means no limit
      min: [0, 'Max per customer cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Calculate if item is sold out
FlashSaleItemSchema.virtual('isSoldOut').get(function() {
  return this.quantitySold >= this.quantity;
});

// Calculate remaining quantity
FlashSaleItemSchema.virtual('remainingQuantity').get(function() {
  return Math.max(0, this.quantity - this.quantitySold);
});

// Calculate final price before saving
FlashSaleItemSchema.pre('save', async function(next) {
  try {
    if (this.isModified('discountPercent') || !this.discountedPrice) {
      let basePrice;
      
      if (this.variantId) {
        const variant = await mongoose.model('ProductVariant').findById(this.variantId);
        if (variant) {
          const product = await mongoose.model('Product').findById(this.productId);
          basePrice = product.basePrice + variant.priceAdjustment;
        }
      } else {
        const product = await mongoose.model('Product').findById(this.productId);
        if (product) {
          basePrice = product.basePrice;
        }
      }
      
      if (basePrice) {
        this.discountedPrice = basePrice * (1 - this.discountPercent / 100);
        this.discountedPrice = Math.round(this.discountedPrice * 100) / 100; // Round to 2 decimal places
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Indexes for performance
FlashSaleItemSchema.index({ flashSaleId: 1, productId: 1, variantId: 1 }, { unique: true });
FlashSaleItemSchema.index({ productId: 1 });
FlashSaleItemSchema.index({ variantId: 1 });

module.exports = mongoose.model('FlashSaleItem', FlashSaleItemSchema);