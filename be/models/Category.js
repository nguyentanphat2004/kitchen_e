// models/Category.js
const mongoose = require('mongoose');
const slugify = require('slugify');
const mongoosePaginate = require('mongoose-paginate-v2');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    image: {
      type: String
    },
    imagePath: {
      type: String,
      description: 'Storage path or S3 key for the image'
    },
    icon: {
      type: String,
      description: 'Icon class or URL'
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    featured: {
      type: Boolean,
      default: false
    },
    showInMenu: {
      type: Boolean,
      default: true
    },
    showInHome: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    metaTitle: String,
    metaDescription: String,
    metaKeywords: String
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for subcategories
CategorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId'
});

// Virtual for products count
CategorySchema.virtual('productsCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
});

// Create slug from name
CategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Middleware for soft delete
CategorySchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

// Static method to get hierarchy
CategorySchema.statics.getHierarchy = async function() {
  // Get all non-deleted categories
  const categories = await this.find({ isDeleted: false })
    .sort('displayOrder name')
    .lean();
  
  // Create a map for quick lookup
  const categoryMap = {};
  categories.forEach(category => {
    category.children = [];
    categoryMap[category._id.toString()] = category;
  });
  
  // Build the hierarchy
  const rootCategories = [];
  
  categories.forEach(category => {
    if (category.parentId) {
      const parentId = category.parentId.toString();
      if (categoryMap[parentId]) {
        categoryMap[parentId].children.push(category);
      } else {
        rootCategories.push(category);
      }
    } else {
      rootCategories.push(category);
    }
  });
  
  return rootCategories;
};

// Static method to get featured categories
CategorySchema.statics.getFeaturedCategories = async function(limit = 5) {
  return this.find({
    featured: true,
    isActive: true,
    isDeleted: false
  })
    .sort('displayOrder')
    .limit(limit);
};

// Indexes for faster lookups
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ isActive: 1, isDeleted: 1 });
CategorySchema.index({ featured: 1 });
CategorySchema.index({ 
  name: 'text', 
  description: 'text'
});

// Add pagination plugin
CategorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Category', CategorySchema);