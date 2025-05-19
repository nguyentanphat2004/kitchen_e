// models/Cart.js
const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    sessionId: {
      type: String,
      description: 'For guest carts before login'
    },
    status: {
      type: String,
      enum: ['active', 'merged', 'abandoned', 'converted'],
      default: 'active'
    },
    subtotal: {
      type: Number,
      default: 0
    },
    metadata: {
      type: Map,
      of: String,
      description: 'Additional data like UTM parameters or referrer'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for cart items
CartSchema.virtual('items', {
  ref: 'CartItem',
  localField: '_id',
  foreignField: 'cartId'
});

// Method to calculate cart totals
CartSchema.methods.calculateTotals = async function() {
  const CartItem = mongoose.model('CartItem');
  const items = await CartItem.find({ cartId: this._id }).populate({
    path: 'productId',
    select: 'basePrice'
  }).populate({
    path: 'variantId',
    select: 'priceAdjustment'
  });
  
  let subtotal = 0;
  
  for (const item of items) {
    let price = item.price || 0;
    
    // If price is not set on cart item, calculate from product + variant
    if (!price && item.productId) {
      price = item.productId.basePrice || 0;
      
      if (item.variantId && item.variantId.priceAdjustment) {
        price += item.variantId.priceAdjustment;
      }
    }
    
    subtotal += price * item.quantity;
  }
  
  this.subtotal = subtotal;
  return this.save();
};

// Method to merge guest cart with user cart
CartSchema.statics.mergeWithUserCart = async function(sessionId, userId) {
  // Find guest cart
  const guestCart = await this.findOne({ sessionId, userId: null });
  if (!guestCart) return null;
  
  // Find or create user cart
  let userCart = await this.findOne({ userId, status: 'active' });
  if (!userCart) {
    userCart = await this.create({
      userId,
      status: 'active'
    });
  }
  
  // Get guest cart items
  const CartItem = mongoose.model('CartItem');
  const guestItems = await CartItem.find({ cartId: guestCart._id });
  
  // Transfer items to user cart
  for (const item of guestItems) {
    // Check if same product+variant already exists in user cart
    const existingItem = await CartItem.findOne({
      cartId: userCart._id,
      productId: item.productId,
      variantId: item.variantId || null
    });
    
    if (existingItem) {
      // Update quantity
      existingItem.quantity += item.quantity;
      await existingItem.save();
      // Delete guest item
      await CartItem.deleteOne({ _id: item._id });
    } else {
      // Move item to user cart
      item.cartId = userCart._id;
      await item.save();
    }
  }
  
  // Mark guest cart as merged
  guestCart.status = 'merged';
  await guestCart.save();
  
  // Recalculate user cart totals
  await userCart.calculateTotals();
  
  return userCart;
};

// Index for faster lookups
CartSchema.index({ userId: 1, status: 1 });
CartSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Cart', CartSchema);