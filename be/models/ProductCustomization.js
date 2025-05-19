// models/ProductCustomization.js
const mongoose = require('mongoose');

const ProductCustomizationSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    customizationType: {
      type: String,
      required: [true, 'Customization type is required'],
      enum: ['color', 'engraving', 'size', 'material', 'packaging', 'other'],
      default: 'other'
    },
    name: {
      type: String,
      required: [true, 'Customization name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    options: [
      {
        name: {
          type: String,
          required: [true, 'Option name is required']
        },
        value: {
          type: String,
          required: [true, 'Option value is required']
        },
        priceAdjustment: {
          type: Number,
          default: 0
        },
        image: {
          type: String
        },
        imagePath: {
          type: String,
          description: 'Storage path or S3 key'
        },
        isDefault: {
          type: Boolean,
          default: false
        }
      }
    ],
    isRequired: {
      type: Boolean,
      default: false
    },
    displayOrder: {
      type: Number,
      default: 0
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

// Ensure only one default option
ProductCustomizationSchema.pre('save', function(next) {
  // If there are options and this is a modification that affects options
  if (this.options && this.options.length > 0 && this.isModified('options')) {
    // Count number of default options
    const defaultCount = this.options.filter(option => option.isDefault).length;
    
    // If no default option is set, make the first one default
    if (defaultCount === 0 && this.options.length > 0) {
      this.options[0].isDefault = true;
    }
    // If multiple default options are set, keep only the first one as default
    else if (defaultCount > 1) {
      let foundDefault = false;
      this.options = this.options.map(option => {
        if (option.isDefault) {
          if (!foundDefault) {
            foundDefault = true;
          } else {
            option.isDefault = false;
          }
        }
        return option;
      });
    }
  }
  
  next();
});

// Middleware for soft delete
ProductCustomizationSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

// Index for faster lookups
ProductCustomizationSchema.index({ productId: 1, customizationType: 1 });

module.exports = mongoose.model('ProductCustomization', ProductCustomizationSchema);