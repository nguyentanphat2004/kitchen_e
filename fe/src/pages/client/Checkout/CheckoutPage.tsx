import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, ShoppingBag, CreditCard, Gift, Truck, Info, Check, Lock } from 'lucide-react';

// Interface cho thông tin thanh toán
interface PaymentInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  province: string;
  zipCode: string;
  country: string;
  saveInfo: boolean;
  shipToDifferentAddress: boolean;
  shippingMethod: string;
  paymentMethod: string;
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  discountCode: string;
}

// Interface cho sản phẩm trong giỏ hàng
interface CartItem {
  id: string;
  name: string;
  variant: string;
  quantity: number;
  price: number;
  image: string;
}

// Component cho trang thanh toán
const CheckoutPage: React.FC = () => {
  // State cho thông tin thanh toán
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    province: '',
    zipCode: '',
    country: 'Việt Nam',
    saveInfo: true,
    shipToDifferentAddress: false,
    shippingMethod: 'standard',
    paymentMethod: 'card',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    discountCode: ''
  });

  // Sản phẩm trong giỏ hàng (giả lập)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'ap2-blue-standard',
      name: 'Always Pan 2.0',
      variant: 'Tiêu chuẩn (10.5"), Xanh Dương',
      quantity: 1,
      price: 2970000,
      image: 'https://i.imgur.com/R7Hni84.jpg'
    },
    {
      id: 'hot-grips',
      name: 'Hot Grips',
      variant: 'Xanh Dương',
      quantity: 1,
      price: 690000,
      image: 'https://i.imgur.com/Rlc01kG.jpg'
    }
  ]);

  // Tính tổng tiền hàng
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Phí vận chuyển
  const shippingFee = paymentInfo.shippingMethod === 'express' ? 150000 : 0;
  
  // Giảm giá (giả lập)
  const discount = paymentInfo.discountCode ? 300000 : 0;
  
  // Tổng cộng
  const total = subtotal + shippingFee - discount;

  // Hàm cập nhật thông tin thanh toán
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setPaymentInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Hàm xử lý khi xóa sản phẩm
  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Hàm xử lý khi cập nhật số lượng
  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Hàm xử lý khi hoàn tất đơn hàng
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Đơn hàng đã được gửi thành công!');
    // Xử lý tiếp theo: gửi thông tin đơn hàng đến API, chuyển hướng trang, v.v.
  };

  return (
    <div className="bg-[#f8f5f2] min-h-screen">
      {/* Thanh điều hướng */}
      <div className="bg-white py-4 shadow-sm mb-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <a href="/gio-hang" className="flex items-center text-gray-600 hover:text-gray-900">
              <ChevronLeft size={20} />
              <span className="ml-1">Quay lại giỏ hàng</span>
            </a>
            <div className="mx-auto">
              <h1 className="text-2xl font-serif font-bold text-center">Our Place</h1>
            </div>
            <div className="w-24"></div> {/* Spacer để cân bằng layout */}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 pb-16">
        <form onSubmit={handleSubmitOrder}>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Phần trái: Thông tin thanh toán và giao hàng */}
            <div className="lg:w-3/5">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-medium mb-6">Thông tin liên hệ</h2>
                
                <div className="mb-6">
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Họ *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={paymentInfo.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Tên *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={paymentInfo.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={paymentInfo.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={paymentInfo.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="saveInfo"
                      name="saveInfo"
                      checked={paymentInfo.saveInfo}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="saveInfo" className="ml-2 text-sm text-gray-700">
                      Lưu thông tin này cho lần sau
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-medium mb-6">Địa chỉ giao hàng</h2>
                
                <div className="mb-6">
                  <div className="mb-4">
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Quốc gia/Khu vực *</label>
                    <select
                      id="country"
                      name="country"
                      value={paymentInfo.country}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Việt Nam">Việt Nam</option>
                      <option value="Thái Lan">Thái Lan</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Malaysia">Malaysia</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ *</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={paymentInfo.address}
                      onChange={handleChange}
                      required
                      placeholder="Số nhà, tên đường"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-1">Căn hộ, dãy phòng, v.v. (tuỳ chọn)</label>
                    <input
                      type="text"
                      id="apartment"
                      name="apartment"
                      value={paymentInfo.apartment}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Thành phố *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={paymentInfo.city}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố *</label>
                      <select
                        id="province"
                        name="province"
                        value={paymentInfo.province}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Chọn tỉnh/thành phố</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Thanh Hóa">Thanh Hóa</option>
                      </select>
                    </div>
                    <div className="md:w-1/4">
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">Mã bưu điện *</label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={paymentInfo.zipCode}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="shipToDifferentAddress"
                      name="shipToDifferentAddress"
                      checked={paymentInfo.shipToDifferentAddress}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="shipToDifferentAddress" className="ml-2 text-sm text-gray-700">
                      Giao hàng đến địa chỉ khác?
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-medium mb-6">Phương thức vận chuyển</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="standard"
                      checked={paymentInfo.shippingMethod === 'standard'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <span className="block font-medium">Vận chuyển tiêu chuẩn (MIỄN PHÍ)</span>
                      <span className="block text-sm text-gray-500">3-6 ngày làm việc</span>
                    </div>
                    <span className="text-green-600 font-medium">Miễn phí</span>
                  </label>
                  
                  <label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="express"
                      checked={paymentInfo.shippingMethod === 'express'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <span className="block font-medium">Vận chuyển nhanh</span>
                      <span className="block text-sm text-gray-500">1-2 ngày làm việc</span>
                    </div>
                    <span className="font-medium">150.000₫</span>
                  </label>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-medium mb-6">Phương thức thanh toán</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentInfo.paymentMethod === 'card'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <span className="block font-medium">Thẻ tín dụng / Thẻ ghi nợ</span>
                      <div className="flex space-x-2 mt-1">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" 
                             alt="Visa" className="h-8 w-auto" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" 
                             alt="Mastercard" className="h-8 w-auto" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/1200px-American_Express_logo_%282018%29.svg.png" 
                             alt="American Express" className="h-8 w-auto" />
                      </div>
                    </div>
                  </label>
                  
                  {paymentInfo.paymentMethod === 'card' && (
                    <div className="border rounded-md p-4 mt-2 bg-gray-50">
                      <div className="mb-4">
                        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">Số thẻ *</label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          value={paymentInfo.cardNumber}
                          onChange={handleChange}
                          required
                          placeholder="XXXX XXXX XXXX XXXX"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">Tên chủ thẻ *</label>
                        <input
                          type="text"
                          id="cardName"
                          name="cardName"
                          value={paymentInfo.cardName}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn *</label>
                          <input
                            type="text"
                            id="expiryDate"
                            name="expiryDate"
                            value={paymentInfo.expiryDate}
                            onChange={handleChange}
                            required
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-1/3">
                          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                          <input
                            type="text"
                            id="cvv"
                            name="cvv"
                            value={paymentInfo.cvv}
                            onChange={handleChange}
                            required
                            placeholder="123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentInfo.paymentMethod === 'paypal'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <span className="block font-medium">PayPal</span>
                      <span className="block text-sm text-gray-500">Thanh toán an toàn qua PayPal</span>
                    </div>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1280px-PayPal.svg.png" 
                         alt="PayPal" className="h-8 w-auto" />
                  </label>
                  
                  <label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentInfo.paymentMethod === 'cod'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <span className="block font-medium">Thanh toán khi nhận hàng (COD)</span>
                      <span className="block text-sm text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Phần phải: Tổng quan đơn hàng */}
            <div className="lg:w-2/5">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-6">
                <h2 className="text-xl font-medium mb-6">Tổng quan đơn hàng</h2>
                
                <div className="border-b pb-6 mb-6">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex py-4 border-b last:border-0">
                      <div className="relative bg-[#f8f6f3] rounded-md w-20 h-20 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain p-2"
                        />
                        <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.variant}</p>
                        <div className="flex items-center mt-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            -
                          </button>
                          <span className="mx-2">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="ml-auto text-sm text-gray-600 underline"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <span className="font-medium">{item.price.toLocaleString()}₫</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <input
                      type="text"
                      id="discountCode"
                      name="discountCode"
                      value={paymentInfo.discountCode}
                      onChange={handleChange}
                      placeholder="Mã giảm giá hoặc phiếu quà tặng"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      className="bg-gray-800 text-white px-4 py-2 rounded-r-md hover:bg-gray-700"
                    >
                      Áp dụng
                    </button>
                  </div>
                  
                  {paymentInfo.discountCode && (
                    <div className="flex items-center text-green-600 bg-green-50 p-2 rounded-md">
                      <Check size={16} className="mr-2" />
                      <span>Đã áp dụng mã giảm giá: {paymentInfo.discountCode}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <span>{subtotal.toLocaleString()}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span>{shippingFee > 0 ? `${shippingFee.toLocaleString()}₫` : 'Miễn phí'}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá</span>
                      <span>-{discount.toLocaleString()}₫</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between font-bold">
                    <span>Tổng cộng</span>
                    <span>{total.toLocaleString()}₫</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Bằng cách nhấn "Đặt hàng", bạn đồng ý với{' '}
                    <a href="#" className="underline">Điều khoản dịch vụ</a>{' '}
                    và{' '}
                    <a href="#" className="underline">Chính sách bảo mật</a>{' '}
                    của chúng tôi.
                  </p>
                  
                  <button
                    type="submit"
                    className="w-full bg-[#b75e41] text-white py-3 rounded-md font-medium flex items-center justify-center"
                  >
                    <Lock size={16} className="mr-2" />
                    ĐẶT HÀNG ({total.toLocaleString()}₫)
                  </button>
                </div>
                
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" 
                      alt="Visa" className="h-5 w-auto mx-1" />
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" 
                      alt="Mastercard" className="h-5 w-auto mx-1" />
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/1200px-American_Express_logo_%282018%29.svg.png" 
                      alt="American Express" className="h-5 w-auto mx-1" />
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1280px-PayPal.svg.png" 
                      alt="PayPal" className="h-5 w-auto mx-1" />
                  </div>
                  <p className="text-xs text-gray-500">Thanh toán an toàn & bảo mật</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;