// models/index.js
// Centralized export of all models

const User = require('./User');
const FaceAuthData = require('./FaceAuthData');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const ProductCustomization = require('./ProductCustomization');
const Category = require('./Category');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const FlashSale = require('./FlashSale');
const FlashSaleItem = require('./FlashSaleItem');
const Voucher = require('./Voucher');
const UserVoucher = require('./UserVoucher');
const Payment = require('./Payment');
const Review = require('./Review');
const Wishlist = require('./Wishlist');
const AIAssistantLog = require('./AIAssistantLog');
const Bundle = require('./Bundle');
const BundleItem = require('./BundleItem');
const Recipe = require('./Recipe');
const RecipeProductLink = require('./RecipeProductLink');
const MaintenanceReminder = require('./MaintenanceReminder');
const Notification = require('./Notification')
module.exports = {
  User,
  FaceAuthData,
  Product,
  ProductVariant,
  ProductCustomization,
  Category,
  Order,
  OrderItem,
  Cart,
  CartItem,
  FlashSale,
  FlashSaleItem,
  Voucher,
  UserVoucher,
  Payment,
  Review,
  Wishlist,
  AIAssistantLog,
  Bundle,
  BundleItem,
  Recipe,
  RecipeProductLink,
  MaintenanceReminder,
  Notification
};
