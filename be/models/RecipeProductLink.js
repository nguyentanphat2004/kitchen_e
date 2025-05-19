// models/RecipeProductLink.js
const mongoose = require('mongoose');

const RecipeProductLinkSchema = new mongoose.Schema(
  {
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: [true, 'Recipe ID is required']
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    relevance: {
      type: Number,
      default: 1,
      min: [0, 'Relevance cannot be negative'],
      max: [10, 'Relevance cannot exceed 10'],
      description: 'Relevance score (0-10) - higher means more relevant'
    },
    isEssential: {
      type: Boolean,
      default: false,
      description: 'Whether this product is essential for the recipe'
    },
    isRecommended: {
      type: Boolean,
      default: true,
      description: 'Whether this product is recommended for the recipe'
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [200, 'Comment cannot exceed 200 characters'],
      description: 'Comment explaining why this product is recommended'
    },
    ingredientMapping: {
      type: [String],
      description: 'Names of ingredients this product is used for'
    },
    variantIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'ProductVariant',
      description: 'Optional specific variants that are recommended'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Middleware to check if recipe and product exist
RecipeProductLinkSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('recipeId') || this.isModified('productId')) {
    try {
      // Check if recipe exists
      const Recipe = mongoose.model('Recipe');
      const recipe = await Recipe.findOne({
        _id: this.recipeId,
        isDeleted: false
      });
      
      if (!recipe) {
        return next(new Error('Recipe not found or no longer available'));
      }
      
      // Check if product exists
      const Product = mongoose.model('Product');
      const product = await Product.findOne({
        _id: this.productId,
        isDeleted: false
      });
      
      if (!product) {
        return next(new Error('Product not found or no longer available'));
      }
      
      // Check if variants exist if provided
      if (this.variantIds && this.variantIds.length > 0) {
        const ProductVariant = mongoose.model('ProductVariant');
        
        for (const variantId of this.variantIds) {
          const variant = await ProductVariant.findOne({
            _id: variantId,
            productId: this.productId,
            isDeleted: false
          });
          
          if (!variant) {
            return next(new Error(`Product variant ${variantId} not found or no longer available`));
          }
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

// Static method to get recipe recommendations for a product
RecipeProductLinkSchema.statics.getRecipesForProduct = async function(productId, limit = 5) {
  try {
    const links = await this.find({ productId })
      .sort({ relevance: -1, isEssential: -1 })
      .limit(limit)
      .populate({
        path: 'recipeId',
        select: 'title slug description coverImage difficulty preparationTime cookingTime'
      });
    
    return links.map(link => link.recipeId);
  } catch (error) {
    throw new Error(`Failed to get recipes for product: ${error.message}`);
  }
};

// Static method to get product recommendations for a recipe
RecipeProductLinkSchema.statics.getProductsForRecipe = async function(recipeId) {
  try {
    const links = await this.find({ recipeId })
      .sort({ relevance: -1, isEssential: -1 })
      .populate({
        path: 'productId',
        select: 'name slug images basePrice averageRating description'
      })
      .populate({
        path: 'variantIds',
        select: 'name color size material priceAdjustment'
      });
    
    return links.map(link => ({
      product: link.productId,
      relevance: link.relevance,
      isEssential: link.isEssential,
      isRecommended: link.isRecommended,
      comment: link.comment,
      ingredientMapping: link.ingredientMapping,
      variants: link.variantIds
    }));
  } catch (error) {
    throw new Error(`Failed to get products for recipe: ${error.message}`);
  }
};

// Static method to update relevance score
RecipeProductLinkSchema.statics.updateRelevance = async function(recipeId, productId, newRelevance) {
  try {
    const link = await this.findOne({ recipeId, productId });
    
    if (!link) {
      throw new Error('Link not found');
    }
    
    link.relevance = newRelevance;
    return link.save();
  } catch (error) {
    throw new Error(`Failed to update relevance: ${error.message}`);
  }
};

// Enforce unique recipe-product pairs
RecipeProductLinkSchema.index(
  { recipeId: 1, productId: 1 },
  { unique: true }
);

// Additional indexes for faster lookups
RecipeProductLinkSchema.index({ recipeId: 1, relevance: -1 });
RecipeProductLinkSchema.index({ productId: 1, relevance: -1 });
RecipeProductLinkSchema.index({ isEssential: 1 });

module.exports = mongoose.model('RecipeProductLink', RecipeProductLinkSchema);
