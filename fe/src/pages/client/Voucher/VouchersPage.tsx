import React, { useState } from 'react';
import { Search, User, ShoppingBag, Scissors, Clock, ChevronRight, AlertCircle, Copy, Share2, Calendar, Plus } from 'lucide-react';

// Định nghĩa kiểu dữ liệu
interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend?: number;
  expiryDate: string;
  status: 'valid' | 'used' | 'expired';
  isNew?: boolean;
  category?: string;
  usageLimit?: number;
  usageCount?: number;
  imageUrl?: string;
}

// Component chính cho trang phiếu giảm giá
const VouchersPage: React.FC = () => {
  // State cho danh sách phiếu giảm giá (dữ liệu mẫu)
  const [vouchers, setVouchers] = useState<Voucher[]>([
    {
      id: 'voucher-1',
      code: 'WELCOME15',
      title: 'Chào mừng thành viên mới',
      description: 'Giảm 15% cho đơn hàng đầu tiên của bạn',
      discountType: 'percentage',
      discountValue: 15,
      minSpend: 500000,
      expiryDate: '30/06/2025',
      status: 'valid',
      isNew: true,
      category: 'welcome',
      usageLimit: 1,
      usageCount: 0,
      imageUrl: 'https://i.imgur.com/R7Hni84.jpg'
    },
    {
      id: 'voucher-2',
      code: 'FREESHIP',
      title: 'Miễn phí vận chuyển',
      description: 'Miễn phí vận chuyển cho đơn hàng từ 1.000.000₫',
      discountType: 'fixed',
      discountValue: 50000,
      minSpend: 1000000,
      expiryDate: '15/07/2025',
      status: 'valid',
      category: 'shipping',
      usageLimit: 3,
      usageCount: 0
    },
    {
      id: 'voucher-3',
      code: 'SUMMER200K',
      title: 'Ưu đãi hè',
      description: 'Giảm 200.000₫ cho đơn hàng từ 1.500.000₫',
      discountType: 'fixed',
      discountValue: 200000,
      minSpend: 1500000,
      expiryDate: '31/08/2025',
      status: 'valid',
      category: 'seasonal',
      usageLimit: 1,
      usageCount: 0,
      imageUrl: 'https://i.imgur.com/1hDUYym.jpg'
    },
    {
      id: 'voucher-4',
      code: 'BFRIDAY30',
      title: 'Black Friday',
      description: 'Giảm 30% cho tất cả sản phẩm, tối đa 500.000₫',
      discountType: 'percentage',
      discountValue: 30,
      expiryDate: '01/12/2024',
      status: 'expired',
      category: 'seasonal',
      usageLimit: 1,
      usageCount: 0
    },
    {
      id: 'voucher-5',
      code: 'BIRTHDAY50',
      title: 'Quà sinh nhật',
      description: 'Giảm 50% cho một sản phẩm bất kỳ',
      discountType: 'percentage',
      discountValue: 50,
      minSpend: 0,
      expiryDate: '31/05/2025',
      status: 'used',
      category: 'birthday',
      usageLimit: 1,
      usageCount: 1
    }
  ]);

  // State cho tab đang active
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'used' | 'expired'>('all');
  
  // State cho voucher đang xem chi tiết
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  
  // State cho thông báo
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: ''
  });

  // Lọc voucher dựa trên tab đang active
  const filteredVouchers = vouchers.filter(voucher => {
    if (activeTab === 'all') return true;
    return voucher.status === activeTab;
  });

  // Xử lý khi sao chép mã
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setNotification({
          show: true,
          message: 'Đã sao chép mã giảm giá!'
        });
        
        // Ẩn thông báo sau 3 giây
        setTimeout(() => {
          setNotification({
            show: false,
            message: ''
          });
        }, 3000);
      })
      .catch(err => {
        console.error('Không thể sao chép:', err);
      });
  };

  // Xử lý khi chia sẻ voucher
  const handleShareVoucher = (voucher: Voucher) => {
    if (navigator.share) {
      navigator.share({
        title: `Mã giảm giá ${voucher.title}`,
        text: `Dùng mã ${voucher.code} để ${voucher.description}`,
        url: window.location.href
      })
      .catch(err => {
        console.error('Không thể chia sẻ:', err);
      });
    } else {
      // Fallback nếu Web Share API không được hỗ trợ
      handleCopyCode(voucher.code);
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
      
      {/* Thông báo */}
      {notification.show && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center">
          <span>{notification.message}</span>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        {/* Tiêu đề trang */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-1">Phiếu giảm giá của tôi</h1>
          <p className="text-gray-600">Quản lý và sử dụng các mã giảm giá của bạn</p>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b overflow-x-auto">
            <button 
              className={`px-6 py-3 whitespace-nowrap ${
                activeTab === 'all' 
                  ? 'border-b-2 border-gray-800 text-gray-800 font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('all')}
            >
              Tất cả ({vouchers.length})
            </button>
            <button 
              className={`px-6 py-3 whitespace-nowrap ${
                activeTab === 'valid' 
                  ? 'border-b-2 border-gray-800 text-gray-800 font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('valid')}
            >
              Có thể sử dụng ({vouchers.filter(v => v.status === 'valid').length})
            </button>
            <button 
              className={`px-6 py-3 whitespace-nowrap ${
                activeTab === 'used' 
                  ? 'border-b-2 border-gray-800 text-gray-800 font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('used')}
            >
              Đã sử dụng ({vouchers.filter(v => v.status === 'used').length})
            </button>
            <button 
              className={`px-6 py-3 whitespace-nowrap ${
                activeTab === 'expired' 
                  ? 'border-b-2 border-gray-800 text-gray-800 font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('expired')}
            >
              Đã hết hạn ({vouchers.filter(v => v.status === 'expired').length})
            </button>
          </div>
        </div>
        
        {/* Thêm mã giảm giá mới */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="font-medium">Thêm mã giảm giá mới</h3>
              <p className="text-sm text-gray-600">Nhập mã giảm giá mà bạn đã nhận được</p>
            </div>
          </div>
          <button className="bg-[#b75e41] text-white px-4 py-2 rounded-md hover:bg-[#a34e32]">
            Thêm mã
          </button>
        </div>
        
        {/* Danh sách phiếu giảm giá */}
        {filteredVouchers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVouchers.map(voucher => (
              <div 
                key={voucher.id}
                className={`bg-white rounded-lg shadow-sm overflow-hidden border ${
                  voucher.status === 'valid' 
                    ? 'border-green-200' 
                    : voucher.status === 'used' 
                    ? 'border-gray-200 opacity-75' 
                    : 'border-red-200 opacity-75'
                }`}
              >
                {/* Phần đầu phiếu */}
                <div className="relative">
                  {/* Hình ảnh nền hoặc màu nền */}
                  <div className="h-20 bg-gray-100 flex items-center justify-center p-4">
                    {voucher.imageUrl ? (
                      <img 
                        src={voucher.imageUrl} 
                        alt={voucher.title} 
                        className="h-full w-full object-cover absolute inset-0 opacity-30"
                      />
                    ) : (
                      <div className={`
                        ${voucher.category === 'welcome' ? 'bg-blue-100' : ''}
                        ${voucher.category === 'shipping' ? 'bg-purple-100' : ''}
                        ${voucher.category === 'seasonal' ? 'bg-orange-100' : ''}
                        ${voucher.category === 'birthday' ? 'bg-pink-100' : ''}
                        absolute inset-0 opacity-30
                      `}></div>
                    )}
                    
                    <div className="relative z-10 flex items-center">
                      <Scissors size={20} className="text-gray-500 mr-2" />
                      <h3 className="font-medium text-lg">{voucher.title}</h3>
                    </div>
                  </div>
                  
                  {/* Badge "Mới" nếu có */}
                  {voucher.isNew && voucher.status === 'valid' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Mới
                    </div>
                  )}
                  
                  {/* Đường kẻ răng cưa */}
                  <div className="flex justify-between items-center -mt-1">
                    <div className="w-2 h-4 bg-[#f8f5f2] rounded-r-full"></div>
                    <div className="flex-1 border-b border-dashed border-gray-300"></div>
                    <div className="w-2 h-4 bg-[#f8f5f2] rounded-l-full"></div>
                  </div>
                </div>
                
                {/* Nội dung phiếu */}
                <div className="p-4">
                  <div className="flex mb-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">{voucher.description}</p>
                      
                      {voucher.minSpend !== undefined && voucher.minSpend > 0 && (
                        <p className="text-xs text-gray-500">
                          Áp dụng cho đơn hàng từ {voucher.minSpend.toLocaleString()}₫
                        </p>
                      )}
                    </div>
                    
                    <div className="ml-4 text-right">
                      <div className={`font-bold text-lg ${
                        voucher.status === 'valid' 
                          ? 'text-green-600' 
                          : voucher.status === 'used' 
                          ? 'text-gray-500' 
                          : 'text-red-500'
                      }`}>
                        {voucher.discountType === 'percentage'
                          ? `${voucher.discountValue}%`
                          : `${voucher.discountValue.toLocaleString()}₫`
                        }
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {voucher.usageLimit && (
                          <span>Còn {voucher.usageLimit - (voucher.usageCount || 0)} lần dùng</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mã giảm giá */}
                  <div className="bg-gray-100 rounded-md p-3 flex items-center justify-between mb-3">
                    <div className="font-mono font-medium">{voucher.code}</div>
                    <button 
                      className="text-blue-600"
                      onClick={() => handleCopyCode(voucher.code)}
                      disabled={voucher.status !== 'valid'}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  
                  {/* Trạng thái và ngày hết hạn */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock size={16} className="text-gray-400 mr-1" />
                      <span className="text-sm text-gray-600">
                        {voucher.status === 'valid' 
                          ? `HSD: ${voucher.expiryDate}` 
                          : voucher.status === 'used' 
                          ? 'Đã sử dụng' 
                          : 'Đã hết hạn'}
                      </span>
                    </div>
                    
                    {voucher.status === 'valid' && (
                      <div className="flex space-x-2">
                        <button 
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => handleShareVoucher(voucher)}
                        >
                          <Share2 size={16} />
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => setSelectedVoucher(voucher)}
                        >
                          Chi tiết
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 flex justify-center mb-4">
              <AlertCircle size={48} />
            </div>
            <h3 className="text-xl font-medium mb-2">Không có phiếu giảm giá nào</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {activeTab === 'all' 
                ? 'Bạn chưa có phiếu giảm giá nào. Hãy tiếp tục mua sắm để nhận các ưu đãi đặc biệt.' 
                : activeTab === 'valid' 
                ? 'Bạn không có phiếu giảm giá nào có thể sử dụng. Hãy tiếp tục mua sắm để nhận các ưu đãi đặc biệt.' 
                : activeTab === 'used' 
                ? 'Bạn chưa sử dụng phiếu giảm giá nào.' 
                : 'Bạn không có phiếu giảm giá nào đã hết hạn.'}
            </p>
            <button className="bg-[#b75e41] text-white px-6 py-3 rounded-md hover:bg-[#a34e32]">
              Mua sắm ngay
            </button>
          </div>
        )}
      </div>
      
      {/* Modal chi tiết phiếu giảm giá */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Chi tiết phiếu giảm giá</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedVoucher(null)}
                >
                  &times;
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-1">{selectedVoucher.title}</h3>
                  <p className="text-gray-600">{selectedVoucher.description}</p>
                </div>
                
                <div className="bg-gray-100 rounded-md p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Mã:</span>
                    <div className="flex items-center">
                      <span className="font-mono font-medium mr-2">{selectedVoucher.code}</span>
                      <button 
                        className="text-blue-600"
                        onClick={() => handleCopyCode(selectedVoucher.code)}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Giảm giá:</span>
                    <span className="font-medium">
                      {selectedVoucher.discountType === 'percentage'
                        ? `${selectedVoucher.discountValue}%`
                        : `${selectedVoucher.discountValue.toLocaleString()}₫`
                      }
                    </span>
                  </div>
                  
                  {selectedVoucher.minSpend !== undefined && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Đơn hàng tối thiểu:</span>
                      <span>
                        {selectedVoucher.minSpend > 0 
                          ? `${selectedVoucher.minSpend.toLocaleString()}₫` 
                          : 'Không giới hạn'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Thời hạn:</span>
                    <span>{selectedVoucher.expiryDate}</span>
                  </div>
                  
                  {selectedVoucher.usageLimit && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Lượt sử dụng:</span>
                      <span>
                        {selectedVoucher.usageCount || 0}/{selectedVoucher.usageLimit}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Hướng dẫn sử dụng:</strong></p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Nhập mã vào ô "Mã giảm giá" trong trang thanh toán</li>
                    <li>Một mã giảm giá chỉ được dùng cho một đơn hàng</li>
                    <li>Không thể kết hợp với các mã giảm giá khác</li>
                    <li>Chỉ áp dụng cho các sản phẩm không giảm giá</li>
                  </ul>
                </div>
                
                <div className="pt-4 flex space-x-3">
                  <button 
                    className="flex-1 bg-[#b75e41] text-white py-2 rounded-md hover:bg-[#a34e32]"
                    onClick={() => {
                      window.location.href = '/';
                    }}
                  >
                    Dùng ngay
                  </button>
                  <button 
                    className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={() => handleShareVoucher(selectedVoucher)}
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Thông tin đề xuất */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-medium">Các ưu đãi đang diễn ra</h2>
          </div>
          
          <div className="p-4 flex overflow-x-auto space-x-4 pb-6">
            <div className="min-w-[280px] bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <Calendar size={20} className="text-blue-600 mr-2" />
                <h3 className="font-medium">Khuyến mãi sinh nhật</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">Nhận mã giảm giá đặc biệt vào tháng sinh nhật của bạn. Thêm ngày sinh vào tài khoản để kích hoạt.</p>
              <button className="text-blue-600 text-sm flex items-center">
                Xem thêm <ChevronRight size={14} className="ml-1" />
              </button>
            </div>
            
            <div className="min-w-[280px] bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center mb-2">
                <User size={20} className="text-green-600 mr-2" />
                <h3 className="font-medium">Giới thiệu bạn bè</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">Nhận mã giảm giá 10% cho mỗi người bạn giới thiệu thành công. Bạn bè mới cũng sẽ nhận được ưu đãi.</p>
              <button className="text-green-600 text-sm flex items-center">
                Xem thêm <ChevronRight size={14} className="ml-1" />
              </button>
            </div>
            
            <div className="min-w-[280px] bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center mb-2">
                <ShoppingBag size={20} className="text-orange-600 mr-2" />
                <h3 className="font-medium">Ưu đãi hè 2025</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">Giảm giá lên đến 40% cho bộ sưu tập mùa hè. Mã giảm giá bổ sung cho đơn hàng từ 2.000.000₫.</p>
              <button className="text-orange-600 text-sm flex items-center">
                Xem thêm <ChevronRight size={14} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-medium">Câu hỏi thường gặp</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">Làm thế nào để sử dụng mã giảm giá?</h3>
              <p className="text-gray-600 text-sm">
                Khi thanh toán, nhập mã của bạn vào ô "Mã giảm giá" và nhấp vào "Áp dụng". Giảm giá sẽ được tự động áp dụng nếu đơn hàng của bạn đáp ứng các điều kiện.
              </p>
            </div>
            
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">Tôi có thể kết hợp nhiều mã giảm giá không?</h3>
              <p className="text-gray-600 text-sm">
                Không, bạn chỉ có thể sử dụng một mã giảm giá cho mỗi đơn hàng. Hãy chọn mã có lợi nhất cho bạn.
              </p>
            </div>
            
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">Làm thế nào để nhận thêm mã giảm giá?</h3>
              <p className="text-gray-600 text-sm">
                Đăng ký nhận bản tin email của chúng tôi, theo dõi trên mạng xã hội, và tham gia chương trình khách hàng thân thiết để nhận nhiều mã giảm giá hơn.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Tôi không thể sử dụng mã giảm giá của mình?</h3>
              <p className="text-gray-600 text-sm">
                Hãy đảm bảo mã còn hiệu lực và đơn hàng của bạn đáp ứng mọi điều kiện như giá trị tối thiểu. Nếu vẫn gặp vấn đề, vui lòng liên hệ với bộ phận hỗ trợ khách hàng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VouchersPage;