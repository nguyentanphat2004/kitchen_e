// models/ProductVariant.js
const mongoose = require('mongoose');

const ProductVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Please provide a product id']
    },
    name: {
      type: String,
      required: [true, 'Please provide a variant name'],
      trim: true
    },
    sku: {
      type: String,
      required: [true, 'Please provide a SKU'],
      unique: true,
      trim: true
    },
    color: {
      type: String,
      trim: true
    },
    size: {
      type: String,
      trim: true
    },
    material: {
      type: String,
      trim: true
    },
    images: [
      {
        url: {
          type: String,
          required: true
        },
        path: {
          type: String,
          description: 'Storage path or S3 key'
        },
        altText: String
      }
    ],
    stockQuantity: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      min: [0, 'Stock quantity cannot be negative']
    },
    priceAdjustment: {
      type: Number,
      default: 0,
      description: 'Additional price adjustment for this variant'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Calculate final price (base price + adjustment)
ProductVariantSchema.virtual('finalPrice').get(async function() {
  const product = await mongoose.model('Product').findById(this.productId);
  if (!product) return this.priceAdjustment;
  return product.basePrice + this.priceAdjustment;
});

// Query middleware for soft delete
ProductVariantSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Index for faster lookups
ProductVariantSchema.index({ productId: 1 });
ProductVariantSchema.index({ sku: 1 });

module.exports = mongoose.model('ProductVariant', ProductVariantSchema);