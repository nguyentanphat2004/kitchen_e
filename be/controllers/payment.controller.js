// controllers/payment.controller.js
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/async.middleware');
const axios = require('axios');
const crypto = require('crypto');

/**
 * @desc    Initiate payment for an order
 * @route   POST /api/payments/initiate
 * @access  Private
 */
exports.initiatePayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod, returnUrl } = req.body;
  
  // Validate required fields
  if (!orderId || !paymentMethod) {
    throw new ApiError('Order ID and payment method are required', 400);
  }
  
  // Find order
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new ApiError('Order not found', 404);
  }
  
  // Check if order belongs to user
  if (order.userId.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to pay for this order', 403);
  }
  
  // Check if order is already paid
  if (order.isPaid) {
    throw new ApiError('This order is already paid', 400);
  }
  
  // Check if order is cancelled
  if (order.status === 'cancelled') {
    throw new ApiError('Cannot pay for a cancelled order', 400);
  }
  
  // Check if payment already exists
  const existingPayment = await Payment.findOne({
    orderId,
    status: { $in: ['pending', 'completed'] }
  });
  
  if (existingPayment) {
    // If payment is completed, return success
    if (existingPayment.status === 'completed') {
      return ApiResponse.success(res, { payment: existingPayment }, 'Payment already completed');
    }
    
    // If payment method is different, cancel existing payment and create new one
    if (existingPayment.paymentMethod !== paymentMethod) {
      existingPayment.status = 'cancelled';
      await existingPayment.save();
    } else {
      // Return existing payment info
      return ApiResponse.success(res, { payment: existingPayment });
    }
  }
  
  // Create payment data
  const paymentData = {
    orderId,
    userId: req.user._id,
    paymentMethod,
    amount: order.totalAmount,
    currency: 'VND',
    status: 'pending',
    returnUrl: returnUrl || `${process.env.FRONTEND_URL}/checkout/complete?orderId=${orderId}`,
    notifyUrl: `${process.env.API_URL}/api/payments/webhook`
  };
  
  // Process based on payment method
  if (paymentMethod === 'vnpay') {
    try {
      const payment = await Payment.createPayment(paymentData);
      
      // Generate VNPay payment URL
      const vnpUrl = await generateVnPayUrl(payment, order);
      
      // Update payment with URL
      payment.paymentUrl = vnpUrl;
      await payment.save();
      
      return ApiResponse.success(res, { 
        payment,
        redirectUrl: vnpUrl
      });
    } catch (error) {
      throw new ApiError(`Payment initialization failed: ${error.message}`, 500);
    }
  } 
  else if (paymentMethod === 'momo') {
    try {
      const payment = await Payment.createPayment(paymentData);
      
      // Generate MoMo payment URL
      const momoUrl = await generateMomoUrl(payment, order);
      
      // Update payment with URL
      payment.paymentUrl = momoUrl;
      await payment.save();
      
      return ApiResponse.success(res, { 
        payment,
        redirectUrl: momoUrl
      });
    } catch (error) {
      throw new ApiError(`Payment initialization failed: ${error.message}`, 500);
    }
  }
  else if (paymentMethod === 'zalopay') {
    try {
      const payment = await Payment.createPayment(paymentData);
      
      // Generate ZaloPay payment URL
      const zaloUrl = await generateZaloPayUrl(payment, order);
      
      // Update payment with URL
      payment.paymentUrl = zaloUrl;
      await payment.save();
      
      return ApiResponse.success(res, { 
        payment,
        redirectUrl: zaloUrl
      });
    } catch (error) {
      throw new ApiError(`Payment initialization failed: ${error.message}`, 500);
    }
  }
  else if (paymentMethod === 'cod') {
    // For COD, just create a pending payment record
    const payment = await Payment.createPayment(paymentData);
    
    return ApiResponse.success(res, { payment });
  }
  else {
    throw new ApiError('Unsupported payment method', 400);
  }
});

/**
 * @desc    Complete payment (after redirect from payment gateway)
 * @route   GET /api/payments/complete
 * @access  Public
 */
exports.completePayment = asyncHandler(async (req, res) => {
  const { paymentId, vnp_ResponseCode, vnp_TransactionStatus, orderId } = req.query;
  
  let payment;
  
  // Find payment by ID or order ID
  if (paymentId) {
    payment = await Payment.findOne({ paymentId });
  } else if (orderId) {
    payment = await Payment.findOne({ orderId });
  } else {
    throw new ApiError('Payment ID or Order ID is required', 400);
  }
  
  if (!payment) {
    throw new ApiError('Payment not found', 404);
  }
  
  // Process VNPay response
  if (payment.paymentMethod === 'vnpay' && (vnp_ResponseCode !== undefined || vnp_TransactionStatus !== undefined)) {
    // Save VNPay response
    payment.gatewayResponse = req.query;
    
    // Check payment status
    if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
      payment.status = 'completed';
      payment.transactionId = req.query.vnp_TransactionNo;
      payment.paidAt = new Date();
    } else {
      payment.status = 'failed';
      payment.errorMessage = `VNPay error: ${vnp_ResponseCode}`;
    }
    
    await payment.save();
  }
  // For other payment methods, check status from gateway if needed
  else if (payment.status === 'pending') {
    // Placeholder for checking payment status from gateway
    // In a real implementation, this would verify payment status with the gateway
    
    // For demo purposes, consider it completed
    if (req.query.status === 'success') {
      payment.status = 'completed';
      payment.paidAt = new Date();
      await payment.save();
    } else if (req.query.status === 'failed') {
      payment.status = 'failed';
      payment.errorMessage = req.query.message || 'Payment failed';
      await payment.save();
    }
    // Otherwise keep it as pending
  }
  
  // Find order to include in response
  const order = await Order.findById(payment.orderId);
  
  return ApiResponse.success(res, { 
    payment,
    order: order ? {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      isPaid: order.isPaid
    } : null
  });
});

/**
 * @desc    Payment webhook (for gateway callbacks)
 * @route   POST /api/payments/webhook
 * @access  Public
 */
exports.paymentWebhook = asyncHandler(async (req, res) => {
  const { body } = req;
  
  // Determine payment gateway from request
  let paymentMethod = '';
  let paymentId = '';
  let status = '';
  let transactionId = '';
  
  // VNPay webhook
  if (body.vnp_TxnRef) {
    paymentMethod = 'vnpay';
    // Extract payment ID from TxnRef (format: PM-XXXXX)
    paymentId = body.vnp_TxnRef;
    status = body.vnp_ResponseCode === '00' ? 'completed' : 'failed';
    transactionId = body.vnp_TransactionNo;
  }
  // MoMo webhook
  else if (body.partnerCode === process.env.MOMO_PARTNER_CODE) {
    paymentMethod = 'momo';
    // Extract payment ID from orderId
    paymentId = body.orderId;
    status = body.resultCode === 0 ? 'completed' : 'failed';
    transactionId = body.transId;
  }
  // ZaloPay webhook
  else if (body.appid === process.env.ZALOPAY_APP_ID) {
    paymentMethod = 'zalopay';
    // Extract payment ID from app_trans_id
    paymentId = body.app_trans_id;
    status = body.status === 1 ? 'completed' : 'failed';
    transactionId = body.zp_trans_id;
  }
  else {
    return res.status(400).json({ error: 'Unknown payment gateway' });
  }
  
  try {
    // Find payment
    const payment = await Payment.findOne({ paymentId });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Verify payment method
    if (payment.paymentMethod !== paymentMethod) {
      return res.status(400).json({ error: 'Payment method mismatch' });
    }
    
    // Save webhook data
    payment.gatewayResponse = body;
    
    // Update payment status
    if (status === 'completed' && payment.status !== 'completed') {
      payment.status = 'completed';
      payment.transactionId = transactionId;
      payment.paidAt = new Date();
    } else if (status === 'failed' && payment.status !== 'failed') {
      payment.status = 'failed';
      payment.errorMessage = body.message || `${paymentMethod} error`;
    }
    
    await payment.save();
    
    // Return success response based on payment gateway
    if (paymentMethod === 'vnpay') {
      return res.status(200).send('OK');
    } else if (paymentMethod === 'momo') {
      return res.status(200).json({ status: 'success' });
    } else if (paymentMethod === 'zalopay') {
      return res.status(200).json({ return_code: 1, return_message: 'success' });
    } else {
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @desc    Get payment by ID
 * @route   GET /api/payments/:id
 * @access  Private
 */
exports.getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Find payment
  const payment = await Payment.findById(id);
  
  if (!payment) {
    throw new ApiError('Payment not found', 404);
  }
  
  // Check if payment belongs to user (unless admin)
  if (
    payment.userId.toString() !== req.user._id.toString() && 
    req.user.role !== 'admin' &&
    req.user.role !== 'staff'
  ) {
    throw new ApiError('Not authorized to access this payment', 403);
  }
  
  // Find order
  const order = await Order.findById(payment.orderId);
  
  return ApiResponse.success(res, { 
    payment,
    order: order ? {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      isPaid: order.isPaid
    } : null
  });
});

/**
 * @desc    Process refund
 * @route   POST /api/payments/:id/refund
 * @access  Private (Admin/Staff)
 */
exports.processRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  
  // Validate required fields
  if (!amount || !reason) {
    throw new ApiError('Amount and reason are required', 400);
  }
  
  // Find payment
  const payment = await Payment.findById(id);
  
  if (!payment) {
    throw new ApiError('Payment not found', 404);
  }
  
  // Check if payment is completed
  if (payment.status !== 'completed') {
    throw new ApiError('Can only refund completed payments', 400);
  }
  
  // Process refund
  try {
    const refundResult = await payment.refund(
      parseFloat(amount),
      reason
    );
    
    return ApiResponse.success(res, { refund: refundResult }, 'Refund processed successfully');
  } catch (error) {
    throw new ApiError(`Refund failed: ${error.message}`, 500);
  }
});

/**
 * @desc    Get payment statistics (admin/staff)
 * @route   GET /api/payments/stats
 * @access  Private (Admin/Staff)
 */
exports.getPaymentStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Get payment method stats
  const methodStats = await Payment.getPaymentStats(startDate, endDate);
  
  // Get daily stats
  const dailyStats = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        ...(startDate && { createdAt: { $gte: new Date(startDate) } }),
        ...(endDate && { createdAt: { $lte: new Date(endDate) } })
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        total: { $sum: '$amount' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  return ApiResponse.success(res, {
    byMethod: methodStats,
    daily: dailyStats
  });
});

// Helper function to generate VNPay payment URL
const generateVnPayUrl = async (payment, order) => {
  // In a real implementation, this would call the VNPay API
  // For demo purposes, generate a mock URL
  
  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'DEMO',
    vnp_Amount: Math.round(payment.amount * 100), // Convert to smallest currency unit
    vnp_CreateDate: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14),
    vnp_CurrCode: 'VND',
    vnp_IpAddr: '127.0.0.1',
    vnp_Locale: 'vn',
    vnp_OrderInfo: `Thanh toan don hang ${order.orderNumber}`,
    vnp_OrderType: 'other',
    vnp_ReturnUrl: payment.returnUrl,
    vnp_TxnRef: payment.paymentId
  };
  
  // Sort params alphabetically
  const sortedParams = sortObject(vnp_Params);
  
  // Generate signature
  const signData = Object.keys(sortedParams)
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');
  
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET || 'RANDOM');
  const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest('hex');
  
  // Add signature to params
  vnp_Params['vnp_SecureHash'] = signed;
  
  // Build URL
  const vnpUrl = `${process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'}?` + 
    Object.keys(vnp_Params)
      .map(key => `${key}=${encodeURIComponent(vnp_Params[key])}`)
      .join('&');
  
  return vnpUrl;
};

// Helper function to generate MoMo payment URL
const generateMomoUrl = async (payment, order) => {
  // In a real implementation, this would call the MoMo API
  // For demo purposes, generate a mock URL
  
  const momoParams = {
    partnerCode: process.env.MOMO_PARTNER_CODE || 'DEMO',
    accessKey: process.env.MOMO_ACCESS_KEY || 'RANDOM',
    requestId: payment.paymentId,
    amount: payment.amount.toString(),
    orderId: payment.paymentId,
    orderInfo: `Thanh toan don hang ${order.orderNumber}`,
    returnUrl: payment.returnUrl,
    notifyUrl: payment.notifyUrl,
    extraData: Buffer.from(JSON.stringify({ orderId: order._id.toString() })).toString('base64')
  };
  
  // Generate signature
  const signData = Object.keys(momoParams)
    .map(key => `${key}=${momoParams[key]}`)
    .join('&');
  
  const hmac = crypto.createHmac('sha256', process.env.MOMO_SECRET_KEY || 'RANDOM');
  const signed = hmac.update(signData).digest('hex');
  
  // Add signature to params
  momoParams['signature'] = signed;
  
  // In a real implementation, call MoMo API and get payment URL
  // For demo purposes, generate a mock URL
  const momoUrl = `${process.env.MOMO_URL || 'https://test-payment.momo.vn/v2/gateway/pay'}?` + 
    Object.keys(momoParams)
      .map(key => `${key}=${encodeURIComponent(momoParams[key])}`)
      .join('&');
  
  return momoUrl;
};

// Helper function to generate ZaloPay payment URL
const generateZaloPayUrl = async (payment, order) => {
  // In a real implementation, this would call the ZaloPay API
  // For demo purposes, generate a mock URL
  
  const zaloParams = {
    app_id: process.env.ZALOPAY_APP_ID || 'DEMO',
    app_trans_id: payment.paymentId,
    app_user: order.userId.toString(),
    app_time: Math.floor(Date.now() / 1000),
    amount: payment.amount,
    item: JSON.stringify([{ name: `Đơn hàng ${order.orderNumber}`, amount: payment.amount }]),
    description: `Thanh toán đơn hàng ${order.orderNumber}`,
    bank_code: 'zalopayapp',
    callback_url: payment.notifyUrl,
    redirect_url: payment.returnUrl
  };
  
  // Generate MAC
  const data = Object.keys(zaloParams)
    .filter(key => key !== 'redirect_url' && key !== 'callback_url')
    .sort()
    .map(key => `${key}=${zaloParams[key]}`)
    .join('|');
  
  const hmac = crypto.createHmac('sha256', process.env.ZALOPAY_KEY1 || 'RANDOM');
  const mac = hmac.update(data).digest('hex');
  
  // Add MAC to params
  zaloParams['mac'] = mac;
  
  // In a real implementation, call ZaloPay API and get payment URL
  // For demo purposes, generate a mock URL
  const zaloUrl = `${process.env.ZALOPAY_URL || 'https://sandbox.zalopay.com.vn/v001/tpe/createorder'}?` + 
    Object.keys(zaloParams)
      .map(key => `${key}=${encodeURIComponent(zaloParams[key])}`)
      .join('&');
  
  return zaloUrl;
};

// Helper function to sort object by key
const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  
  return sorted;
};