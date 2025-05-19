// controllers/order.controller.js
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const FlashSaleItem = require('../models/FlashSaleItem');
const Payment = require('../models/Payment');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/async.middleware');
const mongoose = require('mongoose');

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddress,
    billingAddress,
    paymentMethod,
    cartId,
    voucherId,
    notes,
    shippingMethod = 'standard'
  } = req.body;
  
  // Validate required fields
  if (!shippingAddress || !paymentMethod) {
    throw new ApiError('Shipping address and payment method are required', 400);
  }
  
  // Validate shipping address
  if (
    !shippingAddress.fullName ||
    !shippingAddress.phone ||
    !shippingAddress.address ||
    !shippingAddress.city
  ) {
    throw new ApiError('Incomplete shipping address', 400);
  }
  
  // Find the cart
  const cart = await Cart.findById(cartId || req.user.cartId);
  if (!cart || cart.userId.toString() !== req.user._id.toString()) {
    throw new ApiError('Cart not found or does not belong to you', 404);
  }
  
  // Get cart items
  const cartItems = await CartItem.find({ cartId: cart._id })
    .populate('productId')
    .populate('variantId')
    .populate({
      path: 'flashSaleItemId',
      populate: 'flashSaleId'
    });
  
  if (!cartItems || cartItems.length === 0) {
    throw new ApiError('Cart is empty', 400);
  }
  
  // Verify all items are still available
  for (const item of cartItems) {
    // Check if product is still available
    if (!item.productId || item.productId.isDeleted) {
      throw new ApiError(`Product ${item.productId ? item.productId.name : 'unknown'} is no longer available`, 400);
    }
    
    // Check stock
    const stockQuantity = item.variantId 
      ? item.variantId.stockQuantity 
      : item.productId.stockQuantity;
    
    if (stockQuantity < item.quantity) {
      throw new ApiError(`Only ${stockQuantity} units of ${item.productId.name} ${item.variantId ? `(${item.variantId.name})` : ''} available`, 400);
    }
    
    // Check flash sale if applicable
    if (item.flashSaleItemId) {
      const now = new Date();
      const flashSale = item.flashSaleItemId.flashSaleId;
      
      if (!flashSale || now < flashSale.startDate || now > flashSale.endDate) {
        throw new ApiError(`Flash sale for ${item.productId.name} is no longer active`, 400);
      }
      
      if (item.flashSaleItemId.remainingQuantity < item.quantity) {
        throw new ApiError(`Flash sale for ${item.productId.name} only has ${item.flashSaleItemId.remainingQuantity} units left`, 400);
      }
    }
  }
  
  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Calculate totals
    let subtotal = 0;
    let shippingCost = 0;
    let tax = 0;
    let discount = 0;
    
    // Calculate shipping cost based on method and items
    if (shippingMethod === 'express') {
      shippingCost = 50000; // 50K VND for express shipping
    } else if (shippingMethod === 'standard') {
      shippingCost = 30000; // 30K VND for standard shipping
    }
    
    // Apply free shipping for orders over 500K VND
    if (cart.subtotal >= 500000) {
      shippingCost = 0;
    }
    
    // Create order
    const order = await Order.create([{
      userId: req.user._id,
      status: 'pending',
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      subtotal: cart.subtotal,
      shippingCost,
      tax,
      discount,
      totalAmount: cart.subtotal + shippingCost + tax - discount,
      isPaid: paymentMethod === 'cod' ? false : false,
      voucherId: voucherId || null,
      notes: notes || '',
      shippingMethod
    }], { session });
    
    // Create order items from cart items
    const orderItems = [];
    
    for (const item of cartItems) {
      // Check if we need to update product stock
      const product = item.productId;
      const variant = item.variantId;
      
      // Update stock
      if (variant) {
        variant.stockQuantity -= item.quantity;
        await variant.save({ session });
      } else {
        product.stockQuantity -= item.quantity;
        await product.save({ session });
      }
      
      // Update flash sale remaining quantity if applicable
      if (item.flashSaleItemId) {
        item.flashSaleItemId.usedQuantity += item.quantity;
        item.flashSaleItemId.remainingQuantity = 
          Math.max(0, item.flashSaleItemId.totalQuantity - item.flashSaleItemId.usedQuantity);
        
        await item.flashSaleItemId.save({ session });
      }
      
      // Create order item
      const orderItem = await OrderItem.create([{
        orderId: order[0]._id,
        productId: item.productId._id,
        variantId: item.variantId ? item.variantId._id : null,
        quantity: item.quantity,
        price: item.price,
        discount: 0, // Individual item discount
        flashSaleItemId: item.flashSaleItemId ? item.flashSaleItemId._id : null,
        customizations: item.customizations || {},
        notes: item.notes || ''
      }], { session });
      
      orderItems.push(orderItem[0]);
      
      // Remove item from cart
      await CartItem.findByIdAndDelete(item._id, { session });
    }
    
    // Recalculate order totals
    const createdOrder = order[0];
    await createdOrder.calculateTotals();
    
    // Create payment record if not COD
    let payment = null;
    if (paymentMethod !== 'cod') {
      payment = await Payment.create([{
        orderId: createdOrder._id,
        userId: req.user._id,
        paymentMethod,
        amount: createdOrder.totalAmount,
        status: 'pending',
        returnUrl: `${process.env.FRONTEND_URL}/checkout/complete?orderId=${createdOrder._id}`,
        notifyUrl: `${process.env.API_URL}/api/payments/webhook`
      }], { session });
    }
    
    // Clear cart (by marking it as converted)
    cart.status = 'converted';
    await cart.save({ session });
    
    // Commit transaction
    await session.commitTransaction();
    
    // Populate order details for response
    await createdOrder.populate([
      {
        path: 'orderItems',
        populate: [
          {
            path: 'productId',
            select: 'name slug images'
          },
          {
            path: 'variantId',
            select: 'name sku color size material'
          }
        ]
      }
    ]);
    
    return ApiResponse.created(res, { 
      order: createdOrder,
      payment: payment ? payment[0] : null
    }, 'Order created successfully');
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    // End session
    session.endSession();
  }
});

/**
 * @desc    Get all user orders
 * @route   GET /api/orders
 * @access  Private
 */
exports.getUserOrders = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status,
    sort = '-createdAt'
  } = req.query;
  
  // Build query
  const query = { 
    userId: req.user._id
  };
  
  if (status) {
    query.status = status;
  }
  
  // Count total orders matching query
  const total = await Order.countDocuments(query);
  
  // Pagination options
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const totalPages = Math.ceil(total / parseInt(limit));
  
  // Get orders
  const orders = await Order.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate({
      path: 'orderItems',
      options: { sort: { createdAt: 1 } },
      populate: [
        {
          path: 'productId',
          select: 'name slug images'
        },
        {
          path: 'variantId',
          select: 'name sku color size material'
        }
      ]
    });
  
  return ApiResponse.success(res, {
    orders,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      limit: parseInt(limit)
    }
  });
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Find order
  const order = await Order.findById(id);
  
  if (!order) {
    throw new ApiError('Order not found', 404);
  }
  
  // Check if order belongs to user (unless admin)
  if (
    order.userId.toString() !== req.user._id.toString() && 
    req.user.role !== 'admin' &&
    req.user.role !== 'staff'
  ) {
    throw new ApiError('Not authorized to access this order', 403);
  }
  
  // Populate order details
  await order.populate([
    {
      path: 'orderItems',
      options: { sort: { createdAt: 1 } },
      populate: [
        {
          path: 'productId',
          select: 'name slug images'
        },
        {
          path: 'variantId',
          select: 'name sku color size material'
        }
      ]
    },
    {
      path: 'payments'
    }
  ]);
  
  return ApiResponse.success(res, { order });
});

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin/Staff)
 */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, trackingNumber, notes } = req.body;
  
  // Validate status
  if (!status) {
    throw new ApiError('Status is required', 400);
  }
  
  // Check if status is valid
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) {
    throw new ApiError('Invalid status', 400);
  }
  
  // Find order
  const order = await Order.findById(id);
  
  if (!order) {
    throw new ApiError('Order not found', 404);
  }
  
  // Create update object
  const updateData = { status };
  
  // Add tracking number if provided
  if (trackingNumber) {
    updateData.trackingNumber = trackingNumber;
  }
  
  // Add notes if provided
  if (notes) {
    updateData.notes = notes;
  }
  
  // Special handling for cancelled status
  if (status === 'cancelled' && order.status !== 'cancelled') {
    // Check if order can be cancelled
    if (['shipped', 'delivered'].includes(order.status)) {
      throw new ApiError(`Cannot cancel an order that is already ${order.status}`, 400);
    }
    
    // Add cancel reason
    if (req.body.cancelReason) {
      updateData.cancelReason = req.body.cancelReason;
    }
    
    // Start a transaction to restore stock
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Restore stock for each item
      const orderItems = await OrderItem.find({ orderId: order._id })
        .populate('productId')
        .populate('variantId')
        .populate('flashSaleItemId');
      
      for (const item of orderItems) {
        // Restore product stock
        if (item.variantId) {
          await ProductVariant.findByIdAndUpdate(
            item.variantId._id,
            { $inc: { stockQuantity: item.quantity } },
            { session }
          );
        } else if (item.productId) {
          await Product.findByIdAndUpdate(
            item.productId._id,
            { $inc: { stockQuantity: item.quantity } },
            { session }
          );
        }
        
        // Restore flash sale stock if applicable
        if (item.flashSaleItemId) {
          await FlashSaleItem.findByIdAndUpdate(
            item.flashSaleItemId._id,
            { 
              $inc: { usedQuantity: -item.quantity },
              $inc: { remainingQuantity: item.quantity }
            },
            { session }
          );
        }
      }
      
      // Update order
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true, session }
      );
      
      // Commit transaction
      await session.commitTransaction();
      
      // Populate for response
      await updatedOrder.populate([
        {
          path: 'orderItems',
          options: { sort: { createdAt: 1 } },
          populate: [
            {
              path: 'productId',
              select: 'name slug images'
            },
            {
              path: 'variantId',
              select: 'name sku color size material'
            }
          ]
        }
      ]);
      
      return ApiResponse.success(res, { order: updatedOrder }, 'Order status updated successfully');
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      // End session
      session.endSession();
    }
  }
  // Handle other status updates
  else {
    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Populate for response
    await updatedOrder.populate([
      {
        path: 'orderItems',
        options: { sort: { createdAt: 1 } },
        populate: [
          {
            path: 'productId',
            select: 'name slug images'
          },
          {
            path: 'variantId',
            select: 'name sku color size material'
          }
        ]
      }
    ]);
    
    return ApiResponse.success(res, { order: updatedOrder }, 'Order status updated successfully');
  }
});

/**
 * @desc    Cancel order (by customer)
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  // Find order
  const order = await Order.findById(id);
  
  if (!order) {
    throw new ApiError('Order not found', 404);
  }
  
  // Check if order belongs to user
  if (order.userId.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to cancel this order', 403);
  }
  
  // Check if order can be cancelled
  if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
    throw new ApiError(`Cannot cancel an order that is already ${order.status}`, 400);
  }
  
  // Start a transaction to restore stock
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Restore stock for each item
    const orderItems = await OrderItem.find({ orderId: order._id })
      .populate('productId')
      .populate('variantId')
      .populate('flashSaleItemId');
    
    for (const item of orderItems) {
      // Restore product stock
      if (item.variantId) {
        await ProductVariant.findByIdAndUpdate(
          item.variantId._id,
          { $inc: { stockQuantity: item.quantity } },
          { session }
        );
      } else if (item.productId) {
        await Product.findByIdAndUpdate(
          item.productId._id,
          { $inc: { stockQuantity: item.quantity } },
          { session }
        );
      }
      
      // Restore flash sale stock if applicable
      if (item.flashSaleItemId) {
        await FlashSaleItem.findByIdAndUpdate(
          item.flashSaleItemId._id,
          { 
            $inc: { usedQuantity: -item.quantity },
            $inc: { remainingQuantity: item.quantity }
          },
          { session }
        );
      }
    }
    
    // Update order
    order.status = 'cancelled';
    order.cancelReason = reason || 'Cancelled by customer';
    order.cancelledAt = new Date();
    
    await order.save({ session });
    
    // If any payment exists for this order, cancel it
    const payment = await Payment.findOne({ orderId: order._id });
    if (payment && payment.status === 'pending') {
      payment.status = 'cancelled';
      await payment.save({ session });
    }
    
    // Commit transaction
    await session.commitTransaction();
    
    // Populate for response
    await order.populate([
      {
        path: 'orderItems',
        options: { sort: { createdAt: 1 } },
        populate: [
          {
            path: 'productId',
            select: 'name slug images'
          },
          {
            path: 'variantId',
            select: 'name sku color size material'
          }
        ]
      }
    ]);
    
    return ApiResponse.success(res, { order }, 'Order cancelled successfully');
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    // End session
    session.endSession();
  }
});

/**
 * @desc    Get order tracking info
 * @route   GET /api/orders/:id/tracking
 * @access  Private
 */
exports.getOrderTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Find order
  const order = await Order.findById(id);
  
  if (!order) {
    throw new ApiError('Order not found', 404);
  }
  
  // Check if order belongs to user (unless admin)
  if (
    order.userId.toString() !== req.user._id.toString() && 
    req.user.role !== 'admin' &&
    req.user.role !== 'staff'
  ) {
    throw new ApiError('Not authorized to access this order', 403);
  }
  
  // Get tracking info
  const trackingInfo = {
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber,
    shippingMethod: order.shippingMethod,
    timeline: [
      {
        status: 'pending',
        date: order.createdAt,
        description: 'Order placed'
      }
    ]
  };
  
  // Add processing status if applicable
  if (['processing', 'shipped', 'delivered'].includes(order.status)) {
    trackingInfo.timeline.push({
      status: 'processing',
      date: order.updatedAt,
      description: 'Order processing'
    });
  }
  
  // Add shipped status if applicable
  if (['shipped', 'delivered'].includes(order.status)) {
    trackingInfo.timeline.push({
      status: 'shipped',
      date: order.shippedAt,
      description: 'Order shipped'
    });
  }
  
  // Add delivered status if applicable
  if (order.status === 'delivered') {
    trackingInfo.timeline.push({
      status: 'delivered',
      date: order.deliveredAt,
      description: 'Order delivered'
    });
  }
  
  // Add cancelled status if applicable
  if (order.status === 'cancelled') {
    trackingInfo.timeline.push({
      status: 'cancelled',
      date: order.cancelledAt,
      description: `Order cancelled${order.cancelReason ? `: ${order.cancelReason}` : ''}`
    });
  }
  
  return ApiResponse.success(res, { tracking: trackingInfo });
});

/**
 * @desc    Request refund for order item
 * @route   POST /api/orders/:orderId/items/:itemId/refund
 * @access  Private
 */
exports.requestItemRefund = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { reason, amount } = req.body;
  
  // Validate required fields
  if (!reason) {
    throw new ApiError('Refund reason is required', 400);
  }
  
  // Find order
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new ApiError('Order not found', 404);
  }
  
  // Check if order belongs to user
  if (order.userId.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to request refund for this order', 403);
  }
  
  // Check if order is eligible for refund
  if (!['delivered', 'shipped'].includes(order.status)) {
    throw new ApiError(`Cannot request refund for an order with status: ${order.status}`, 400);
  }
  
  // Find order item
  const orderItem = await OrderItem.findOne({
    _id: itemId,
    orderId
  });
  
  if (!orderItem) {
    throw new ApiError('Order item not found', 404);
  }
  
  // Check if item is already refunded or has a pending refund
  if (orderItem.refundStatus !== 'none') {
    throw new ApiError(`Item already has a refund ${orderItem.refundStatus}`, 400);
  }
  
  // Request refund
  await orderItem.requestRefund(reason, amount);
  
  return ApiResponse.success(res, { orderItem }, 'Refund requested successfully');
});

/**
 * @desc    Process refund request (admin/staff)
 * @route   PUT /api/orders/:orderId/items/:itemId/refund
 * @access  Private (Admin/Staff)
 */
exports.processRefundRequest = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { status, amount } = req.body;
  
  // Validate required fields
  if (!status) {
    throw new ApiError('Refund status is required', 400);
  }
  
  // Check if status is valid
  const validStatuses = ['approved', 'rejected', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new ApiError('Invalid refund status', 400);
  }
  
  // Find order item
  const orderItem = await OrderItem.findOne({
    _id: itemId,
    orderId
  });
  
  if (!orderItem) {
    throw new ApiError('Order item not found', 404);
  }
  
  // Check if item has a pending refund
  if (orderItem.refundStatus !== 'requested') {
    throw new ApiError('No refund request to process', 400);
  }
  
  // Process refund
  await orderItem.processRefund(status, amount);
  
  // If refund is approved or completed, process payment refund
  if (status === 'approved' || status === 'completed') {
    const order = await Order.findById(orderId);
    const payment = await Payment.findOne({ orderId });
    
    if (payment && payment.status === 'completed') {
      try {
        await payment.refund(
          orderItem.refundAmount,
          `Refund for item: ${orderItem.productSnapshot.name}`
        );
      } catch (error) {
        console.error('Payment refund failed:', error);
        // Continue anyway, admin can handle payment refund manually
      }
    }
    
    // Check if all items are refunded and update order status if needed
    const allItemsRefunded = await OrderItem.countDocuments({
      orderId,
      refundStatus: { $nin: ['approved', 'completed'] }
    }) === 0;
    
    if (allItemsRefunded) {
      order.status = 'refunded';
      await order.save();
    }
  }
  
  return ApiResponse.success(res, { orderItem }, 'Refund processed successfully');
});

/**
 * @desc    Get order statistics (admin/staff)
 * @route   GET /api/orders/stats
 * @access  Private (Admin/Staff)
 */
exports.getOrderStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Get overall stats
  const overallStats = await Order.getSalesStats(startDate, endDate);
  
  // Get stats by date
  const dailyStats = await Order.getSalesByDate(startDate, endDate, 'day');
  
  // Get stats by status
  const statusStats = await Order.aggregate([
    {
      $match: {
        ...(startDate && { createdAt: { $gte: new Date(startDate) } }),
        ...(endDate && { createdAt: { $lte: new Date(endDate) } })
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);
  
  // Get top products
  const topProducts = await OrderItem.aggregate([
    {
      $match: {
        ...(startDate && { createdAt: { $gte: new Date(startDate) } }),
        ...(endDate && { createdAt: { $lte: new Date(endDate) } })
      }
    },
    {
      $group: {
        _id: '$productId',
        totalQuantity: { $sum: '$quantity' },
        totalSales: { $sum: { $multiply: ['$price', '$quantity'] } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalSales: -1 }
    },
    {
      $limit: 10
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $unwind: '$product'
    },
    {
      $project: {
        _id: 1,
        productName: '$product.name',
        productSlug: '$product.slug',
        productImage: { $arrayElemAt: ['$product.images', 0] },
        totalQuantity: 1,
        totalSales: 1,
        count: 1
      }
    }
  ]);
  
  return ApiResponse.success(res, {
    overall: overallStats,
    daily: dailyStats,
    byStatus: statusStats,
    topProducts
  });
});