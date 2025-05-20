import React, { useState } from 'react';
import { Search, User, ShoppingBag, ChevronDown, ChevronRight, ChevronLeft, Eye, FileText, Star, Heart } from 'lucide-react';

// Định nghĩa kiểu dữ liệu
interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

interface OrderItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image: string;
}

interface Address {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

// Component chính cho trang đơn hàng
const OrdersPage: React.FC = () => {
  // State cho danh sách đơn hàng (dữ liệu mẫu)
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'order-1',
      orderNumber: 'OP123456789',
      date: '15/05/2025',
      status: 'delivered',
      total: 3850000,
      items: [
        {
          id: 'ap2-blue-standard',
          name: 'Always Pan 2.0',
          variant: 'Tiêu chuẩn (10.5"), Xanh Dương',
          price: 2970000,
          quantity: 1,
          image: 'https://i.imgur.com/R7Hni84.jpg'
        },
        {
          id: 'hot-grips',
          name: 'Hot Grips',
          variant: 'Xanh Dương',
          price: 690000,
          quantity: 1,
          image: 'https://i.imgur.com/Rlc01kG.jpg'
        }
      ],
      shippingAddress: {
        fullName: 'Nguyễn Văn A',
        street: '123 Đường Lê Lợi',
        city: 'Quận 1',
        state: 'TP. Hồ Chí Minh',
        zipCode: '70000',
        country: 'Việt Nam',
        phone: '090 123 4567'
      },
      paymentMethod: 'Thẻ tín dụng / Thẻ ghi nợ',
      trackingNumber: 'VN987654321',
      estimatedDelivery: '18/05/2025'
    },
    {
      id: 'order-2',
      orderNumber: 'OP987654321',
      date: '01/05/2025',
      status: 'shipped',
      total: 14800000,
      items: [
        {
          id: 'titanium-set',
          name: 'Bộ Nồi Chảo Titanium Pro',
          variant: 'Đầy đủ bộ, Kem',
          price: 11400000,
          quantity: 1,
          image: 'https://i.imgur.com/UmyP7bB.jpg'
        },
        {
          id: 'hosting-set',
          name: 'Bộ Phục Vụ',
          variant: 'Xanh Dương',
          price: 3400000,
          quantity: 1,
          image: 'https://i.imgur.com/9RklDJh.jpg'
        }
      ],
      shippingAddress: {
        fullName: 'Nguyễn Văn A',
        street: '123 Đường Lê Lợi',
        city: 'Quận 1',
        state: 'TP. Hồ Chí Minh',
        zipCode: '70000',
        country: 'Việt Nam',
        phone: '090 123 4567'
      },
      paymentMethod: 'PayPal',
      trackingNumber: 'VN123498765',
      estimatedDelivery: '09/05/2025'
    },
    {
      id: 'order-3',
      orderNumber: 'OP456789123',
      date: '15/04/2025',
      status: 'processing',
      total: 2970000,
      items: [
        {
          id: 'ap2-green-standard',
          name: 'Always Pan 2.0',
          variant: 'Tiêu chuẩn (10.5"), Xanh Lá',
          price: 2970000,
          quantity: 1,
          image: 'https://i.imgur.com/R7Hni84.jpg'
        }
      ],
      shippingAddress: {
        fullName: 'Nguyễn Văn A',
        street: '123 Đường Lê Lợi',
        city: 'Quận 1',
        state: 'TP. Hồ Chí Minh',
        zipCode: '70000',
        country: 'Việt Nam',
        phone: '090 123 4567'
      },
      paymentMethod: 'Thanh toán khi nhận hàng (COD)'
    },
    {
      id: 'order-4',
      orderNumber: 'OP654321987',
      date: '20/03/2025',
      status: 'cancelled',
      total: 3450000,
      items: [
        {
          id: 'perfect-pot',
          name: 'Perfect Pot',
          variant: 'Tiêu chuẩn, Xám Đá',
          price: 3450000,
          quantity: 1,
          image: 'https://i.imgur.com/CXBkVJW.jpg'
        }
      ],
      shippingAddress: {
        fullName: 'Nguyễn Văn A',
        street: '123 Đường Lê Lợi',
        city: 'Quận 1',
        state: 'TP. Hồ Chí Minh',
        zipCode: '70000',
        country: 'Việt Nam',
        phone: '090 123 4567'
      },
      paymentMethod: 'Thẻ tín dụng / Thẻ ghi nợ'
    }
  ]);

  // State cho đơn hàng được chọn để xem chi tiết
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0]);
  
  // State cho tab đang active trong chi tiết đơn hàng
  const [activeTab, setActiveTab] = useState<'products' | 'shipping' | 'payment'>('products');

  // Các hàm xử lý
  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setActiveTab('products');
  };

  // Hàm để lấy màu và văn bản dựa trên trạng thái đơn hàng
  const getStatusDetails = (status: Order['status']) => {
    switch (status) {
      case 'processing':
        return { color: 'bg-blue-100 text-blue-800', text: 'Đang xử lý' };
      case 'shipped':
        return { color: 'bg-purple-100 text-purple-800', text: 'Đang giao hàng' };
      case 'delivered':
        return { color: 'bg-green-100 text-green-800', text: 'Đã giao hàng' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', text: 'Đã hủy' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: 'Không xác định' };
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5f2]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="text-2xl font-serif">
              <h1 className="font-bold">Our Place</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="hover:underline">NỒI CHẢO</a>
              <a href="#" className="hover:underline">DỤNG CỤ NƯỚNG</a>
              <a href="#" className="hover:underline">THIẾT BỊ</a>
              <a href="#" className="hover:underline">BÀN ĂN</a>
              <a href="#" className="hover:underline">DỤNG CỤ BẾP</a>
              <a href="#" className="hover:underline">BỘ SƯU TẬP</a>
            </nav>
            
            {/* Icons */}
            <div className="flex items-center space-x-4">
              <button>
                <Search size={20} />
              </button>
              <button>
                <User size={20} />
              </button>
              <button className="relative">
                <ShoppingBag size={20} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  2
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        {/* Tiêu đề trang */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-1">Đơn hàng của tôi</h1>
          <p className="text-gray-600">Xem và quản lý các đơn hàng của bạn</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Danh sách đơn hàng */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-medium">Lịch sử đơn hàng</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">#{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusDetails(order.status).color}`}>
                        {getStatusDetails(order.status).text}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Ngày đặt: {order.date}</span>
                      <span>{order.items.length} sản phẩm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{order.total.toLocaleString()}₫</span>
                      <button className="text-blue-600 text-sm flex items-center">
                        Xem chi tiết <ChevronRight size={16} className="ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Chi tiết đơn hàng */}
          {selectedOrder && (
            <div className="lg:w-2/3">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-medium">Chi tiết đơn hàng #{selectedOrder.orderNumber}</h2>
                      <p className="text-sm text-gray-600">Đặt ngày {selectedOrder.date}</p>
                    </div>
                    <div className={`text-sm px-3 py-1 rounded-full ${getStatusDetails(selectedOrder.status).color}`}>
                      {getStatusDetails(selectedOrder.status).text}
                    </div>
                  </div>
                </div>
                
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <button
                      className={`py-3 px-4 text-sm font-medium ${
                        activeTab === 'products'
                          ? 'border-b-2 border-gray-800 text-gray-800'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('products')}
                    >
                      Sản phẩm
                    </button>
                    <button
                      className={`py-3 px-4 text-sm font-medium ${
                        activeTab === 'shipping'
                          ? 'border-b-2 border-gray-800 text-gray-800'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('shipping')}
                    >
                      Thông tin giao hàng
                    </button>
                    <button
                      className={`py-3 px-4 text-sm font-medium ${
                        activeTab === 'payment'
                          ? 'border-b-2 border-gray-800 text-gray-800'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('payment')}
                    >
                      Thanh toán
                    </button>
                  </div>
                </div>
                
                {/* Tab content */}
                <div className="p-4">
                  {/* Sản phẩm */}
                  {activeTab === 'products' && (
                    <div>
                      <div className="divide-y divide-gray-200">
                        {selectedOrder.items.map(item => (
                          <div key={item.id} className="py-4 flex">
                            <div className="bg-[#f8f6f3] rounded-md h-24 w-24 flex-shrink-0 relative overflow-hidden">
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="h-full w-full object-contain p-2"
                              />
                              <span className="absolute top-1 right-1 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {item.quantity}
                              </span>
                            </div>
                            <div className="ml-4 flex-1">
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-sm text-gray-600">{item.variant}</p>
                              <div className="mt-2 flex justify-between">
                                <span className="text-sm text-gray-800">{item.price.toLocaleString()}₫ x {item.quantity}</span>
                                <span className="font-medium">{(item.price * item.quantity).toLocaleString()}₫</span>
                              </div>
                              
                              {selectedOrder.status === 'delivered' && (
                                <div className="mt-2 flex space-x-3">
                                  <button className="text-blue-600 text-sm flex items-center">
                                    <Star size={16} className="mr-1" />
                                    Đánh giá
                                  </button>
                                  <button className="text-blue-600 text-sm flex items-center">
                                    <FileText size={16} className="mr-1" />
                                    Mua lại
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tạm tính</span>
                            <span>{selectedOrder.total.toLocaleString()}₫</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phí vận chuyển</span>
                            <span>Miễn phí</span>
                          </div>
                          <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                            <span>Tổng cộng</span>
                            <span>{selectedOrder.total.toLocaleString()}₫</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Thông tin giao hàng */}
                  {activeTab === 'shipping' && (
                    <div>
                      <div className="mb-6">
                        <h3 className="font-medium mb-3">Địa chỉ giao hàng</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="font-medium">{selectedOrder.shippingAddress.fullName}</p>
                          <p>{selectedOrder.shippingAddress.street}</p>
                          <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                          <p>{selectedOrder.shippingAddress.country}</p>
                          <p className="mt-2">{selectedOrder.shippingAddress.phone}</p>
                        </div>
                      </div>
                      
                      {(selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered') && selectedOrder.trackingNumber && (
                        <div className="mb-6">
                          <h3 className="font-medium mb-3">Thông tin vận chuyển</h3>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-600">Đơn vị vận chuyển:</span>
                              <span>Giao Hàng Nhanh</span>
                            </div>
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-600">Mã vận đơn:</span>
                              <span className="font-medium">{selectedOrder.trackingNumber}</span>
                            </div>
                            {selectedOrder.estimatedDelivery && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Dự kiến giao hàng:</span>
                                <span>{selectedOrder.estimatedDelivery}</span>
                              </div>
                            )}
                            <button className="mt-3 w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700">
                              Theo dõi đơn hàng
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Trạng thái đơn hàng */}
                      <div>
                        <h3 className="font-medium mb-3">Trạng thái đơn hàng</h3>
                        <div className="relative">
                          <div className="absolute top-0 left-4 h-full w-0.5 bg-gray-200"></div>
                          
                          <div className="relative z-10 flex items-center mb-6">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                              <Check size={16} />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium">Đơn hàng đã đặt</p>
                              <p className="text-sm text-gray-600">{selectedOrder.date}</p>
                            </div>
                          </div>
                          
                          {(selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered') && (
                            <div className="relative z-10 flex items-center mb-6">
                              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                <Check size={16} />
                              </div>
                              <div className="ml-4">
                                <p className="font-medium">Đơn hàng đã gửi đi</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(
                                    new Date(selectedOrder.date.split('/').reverse().join('-')).getTime() + 2 * 24 * 60 * 60 * 1000
                                  ).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {selectedOrder.status === 'delivered' && (
                            <div className="relative z-10 flex items-center">
                              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white">
                                <Check size={16} />
                              </div>
                              <div className="ml-4">
                                <p className="font-medium">Đơn hàng đã giao</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(
                                    new Date(selectedOrder.date.split('/').reverse().join('-')).getTime() + 4 * 24 * 60 * 60 * 1000
                                  ).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {selectedOrder.status === 'cancelled' && (
                            <div className="relative z-10 flex items-center">
                              <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white">
                                <Check size={16} />
                              </div>
                              <div className="ml-4">
                                <p className="font-medium">Đơn hàng đã hủy</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(
                                    new Date(selectedOrder.date.split('/').reverse().join('-')).getTime() + 1 * 24 * 60 * 60 * 1000
                                  ).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Thanh toán */}
                  {activeTab === 'payment' && (
                    <div>
                      <div className="mb-6">
                        <h3 className="font-medium mb-3">Phương thức thanh toán</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="font-medium">{selectedOrder.paymentMethod}</p>
                          {selectedOrder.paymentMethod === 'Thẻ tín dụng / Thẻ ghi nợ' && (
                            <p className="text-gray-600 mt-1">Mastercard •••• 1234</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-3">Chi tiết thanh toán</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tạm tính</span>
                              <span>{selectedOrder.total.toLocaleString()}₫</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Phí vận chuyển</span>
                              <span>Miễn phí</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Thuế</span>
                              <span>Đã bao gồm</span>
                            </div>
                            <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                              <span>Tổng cộng</span>
                              <span>{selectedOrder.total.toLocaleString()}₫</span>
                            </div>
                          </div>
                          
                          {selectedOrder.status === 'processing' && (
                            <div className="mt-4 flex justify-end">
                              <button className="text-red-600 text-sm font-medium">Hủy đơn hàng</button>
                            </div>
                          )}
                          
                          {selectedOrder.status === 'delivered' && (
                            <div className="mt-4">
                              <button className="w-full bg-[#b75e41] text-white py-2 rounded-md hover:bg-[#a34e32]">
                                Tải hóa đơn
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Order actions */}
                <div className="p-4 border-t border-gray-200 flex flex-wrap gap-3 justify-between items-center">
                  <div>
                    {selectedOrder.status === 'delivered' && (
                      <button className="bg-[#b75e41] text-white px-4 py-2 rounded-md hover:bg-[#a34e32]">
                        Mua lại tất cả
                      </button>
                    )}
                    {selectedOrder.status === 'processing' && (
                      <button className="text-red-600 font-medium">
                        Hủy đơn hàng
                      </button>
                    )}
                  </div>
                  
                  <div>
                    <button className="text-gray-600 flex items-center">
                      <ChevronLeft size={16} className="mr-1" />
                      Trợ giúp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;