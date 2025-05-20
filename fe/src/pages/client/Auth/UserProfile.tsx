import React, { useState } from 'react';
import { Search, User, ShoppingBag, Camera, Edit, Lock, MapPin, CreditCard, Mail, Phone, LogOut, Heart, Package, Gift, Settings } from 'lucide-react';

// Định nghĩa kiểu dữ liệu
interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  birthdate: string;
  avatar?: string;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  preferences: {
    newsletter: boolean;
    smsUpdates: boolean;
    productRecommendations: boolean;
  };
  loyaltyPoints: number;
}

interface Address {
  id: string;
  isDefault: boolean;
  fullName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface PaymentMethod {
  id: string;
  isDefault: boolean;
  type: 'credit_card' | 'paypal';
  cardType?: 'visa' | 'mastercard' | 'amex';
  cardNumber?: string; // Đã ẩn một phần, chỉ hiển thị 4 số cuối
  cardExpiry?: string;
  paypalEmail?: string;
}

// Component chính cho trang hồ sơ người dùng
const ProfilePage: React.FC = () => {
  // State cho thông tin người dùng (dữ liệu mẫu)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'user-123',
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '090 123 4567',
    birthdate: '15/05/1990',
    avatar: 'https://i.pravatar.cc/150?img=11',
    addresses: [
      {
        id: 'address-1',
        isDefault: true,
        fullName: 'Nguyễn Văn A',
        street: '123 Đường Lê Lợi',
        apartment: 'Tầng 8, Căn 802',
        city: 'Quận 1',
        state: 'TP. Hồ Chí Minh',
        zipCode: '70000',
        country: 'Việt Nam',
        phone: '090 123 4567'
      },
      {
        id: 'address-2',
        isDefault: false,
        fullName: 'Nguyễn Văn A',
        street: '456 Đường Trần Hưng Đạo',
        city: 'Thanh Xuân',
        state: 'Hà Nội',
        zipCode: '10000',
        country: 'Việt Nam',
        phone: '090 123 4567'
      }
    ],
    paymentMethods: [
      {
        id: 'payment-1',
        isDefault: true,
        type: 'credit_card',
        cardType: 'visa',
        cardNumber: '•••• •••• •••• 1234',
        cardExpiry: '05/26'
      },
      {
        id: 'payment-2',
        isDefault: false,
        type: 'paypal',
        paypalEmail: 'nguyenvana@example.com'
      }
    ],
    preferences: {
      newsletter: true,
      smsUpdates: false,
      productRecommendations: true
    },
    loyaltyPoints: 450
  });

  // State cho phần đang active
  const [activeSection, setActiveSection] = useState<
    'overview' | 'addresses' | 'payment' | 'preferences' | 'security'
  >('overview');

  // State cho form chỉnh sửa
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    fullName: userProfile.fullName,
    email: userProfile.email,
    phone: userProfile.phone,
    birthdate: userProfile.birthdate
  });

  // Xử lý khi thay đổi form
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Xử lý khi lưu thông tin
  const handleSaveProfile = () => {
    setUserProfile(prev => ({
      ...prev,
      fullName: editForm.fullName,
      email: editForm.email,
      phone: editForm.phone,
      birthdate: editForm.birthdate
    }));
    setIsEditing(false);
  };

  // Xử lý khi thay đổi tùy chọn
  const handlePreferenceChange = (key: keyof UserProfile['preferences']) => {
    setUserProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key]
      }
    }));
  };

  // Xử lý khi đặt địa chỉ mặc định
  const handleSetDefaultAddress = (addressId: string) => {
    setUserProfile(prev => ({
      ...prev,
      addresses: prev.addresses.map(address => ({
        ...address,
        isDefault: address.id === addressId
      }))
    }));
  };

  // Xử lý khi đặt phương thức thanh toán mặc định
  const handleSetDefaultPayment = (paymentId: string) => {
    setUserProfile(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map(payment => ({
        ...payment,
        isDefault: payment.id === paymentId
      }))
    }));
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
          <h1 className="text-3xl font-serif font-bold mb-1">Tài khoản của tôi</h1>
          <p className="text-gray-600">Quản lý thông tin cá nhân và tùy chọn của bạn</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 flex flex-col items-center text-center border-b border-gray-200">
                <div className="relative mb-4">
                  <div className="h-24 w-24 rounded-full overflow-hidden">
                    <img 
                      src={userProfile.avatar || 'https://i.pravatar.cc/150?img=11'} 
                      alt={userProfile.fullName} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button className="absolute bottom-0 right-0 bg-gray-800 text-white p-1 rounded-full">
                    <Camera size={16} />
                  </button>
                </div>
                <h2 className="font-medium text-lg">{userProfile.fullName}</h2>
                <p className="text-gray-600 text-sm">{userProfile.email}</p>
                
                <div className="mt-4 bg-orange-50 text-orange-800 px-4 py-2 rounded-lg w-full flex items-center justify-center">
                  <span className="font-medium">{userProfile.loyaltyPoints} điểm thưởng</span>
                </div>
              </div>
              
              <div className="p-4">
                <nav className="space-y-1">
                  <button
                    className={`w-full flex items-center px-4 py-3 rounded-lg ${
                      activeSection === 'overview'
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveSection('overview')}
                  >
                    <User size={18} className="mr-3" />
                    Tổng quan tài khoản
                  </button>
                  <button
                    className={`w-full flex items-center px-4 py-3 rounded-lg ${
                      activeSection === 'addresses'
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveSection('addresses')}
                  >
                    <MapPin size={18} className="mr-3" />
                    Địa chỉ của tôi
                  </button>
                  <button
                    className={`w-full flex items-center px-4 py-3 rounded-lg ${
                      activeSection === 'payment'
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveSection('payment')}
                  >
                    <CreditCard size={18} className="mr-3" />
                    Phương thức thanh toán
                  </button>
                  <button
                    className={`w-full flex items-center px-4 py-3 rounded-lg ${
                      activeSection === 'preferences'
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveSection('preferences')}
                  >
                    <Settings size={18} className="mr-3" />
                    Tùy chọn thông báo
                  </button>
                  <button
                    className={`w-full flex items-center px-4 py-3 rounded-lg ${
                      activeSection === 'security'
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveSection('security')}
                  >
                    <Lock size={18} className="mr-3" />
                    Bảo mật tài khoản
                  </button>
                </nav>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <a href="/orders" className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
                    <Package size={18} className="mr-3" />
                    Đơn hàng của tôi
                  </a>
                  <a href="/wishlist" className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
                    <Heart size={18} className="mr-3" />
                    Sản phẩm yêu thích
                  </a>
                  <a href="/vouchers" className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
                    <Gift size={18} className="mr-3" />
                    Phiếu giảm giá của tôi
                  </a>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50">
                    <LogOut size={18} className="mr-3" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Tổng quan tài khoản */}
              {activeSection === 'overview' && (
                <div>
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-medium">Thông tin cá nhân</h2>
                    {!isEditing && (
                      <button
                        className="text-blue-600 flex items-center"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit size={16} className="mr-1" />
                        Chỉnh sửa
                      </button>
                    )}
                  </div>
                  
                  <div className="p-6">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                            Họ và tên
                          </label>
                          <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={editForm.fullName}
                            onChange={handleFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={editForm.email}
                            onChange={handleFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Số điện thoại
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={editForm.phone}
                            onChange={handleFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày sinh
                          </label>
                          <input
                            type="text"
                            id="birthdate"
                            name="birthdate"
                            value={editForm.birthdate}
                            onChange={handleFormChange}
                            placeholder="DD/MM/YYYY"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="flex space-x-4 pt-4">
                          <button
                            className="px-4 py-2 bg-[#b75e41] text-white rounded-md hover:bg-[#a34e32]"
                            onClick={handleSaveProfile}
                          >
                            Lưu thông tin
                          </button>
                          <button
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              setIsEditing(false);
                              setEditForm({
                                fullName: userProfile.fullName,
                                email: userProfile.email,
                                phone: userProfile.phone,
                                birthdate: userProfile.birthdate
                              });
                            }}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm text-gray-500 mb-1">Họ và tên</h3>
                            <p>{userProfile.fullName}</p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm text-gray-500 mb-1">Ngày sinh</h3>
                            <p>{userProfile.birthdate}</p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm text-gray-500 mb-1">Email</h3>
                            <p className="flex items-center">
                              <Mail size={16} className="mr-2 text-gray-400" />
                              {userProfile.email}
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm text-gray-500 mb-1">Số điện thoại</h3>
                            <p className="flex items-center">
                              <Phone size={16} className="mr-2 text-gray-400" />
                              {userProfile.phone}
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-6 border-t border-gray-200">
                          <h3 className="font-medium mb-3">Địa chỉ mặc định</h3>
                          {userProfile.addresses.find(addr => addr.isDefault) && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="font-medium">{userProfile.addresses.find(addr => addr.isDefault)?.fullName}</p>
                              <p>{userProfile.addresses.find(addr => addr.isDefault)?.street}</p>
                              {userProfile.addresses.find(addr => addr.isDefault)?.apartment && (
                                <p>{userProfile.addresses.find(addr => addr.isDefault)?.apartment}</p>
                              )}
                              <p>
                                {userProfile.addresses.find(addr => addr.isDefault)?.city}, {userProfile.addresses.find(addr => addr.isDefault)?.state} {userProfile.addresses.find(addr => addr.isDefault)?.zipCode}
                              </p>
                              <p>{userProfile.addresses.find(addr => addr.isDefault)?.country}</p>
                              <p className="mt-2">{userProfile.addresses.find(addr => addr.isDefault)?.phone}</p>
                              
                              <div className="mt-3 flex justify-end">
                                <button 
                                  className="text-blue-600 flex items-center"
                                  onClick={() => setActiveSection('addresses')}
                                >
                                  Quản lý địa chỉ
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-6 border-t border-gray-200">
                          <h3 className="font-medium mb-3">Phương thức thanh toán mặc định</h3>
                          {userProfile.paymentMethods.find(payment => payment.isDefault) && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              {userProfile.paymentMethods.find(payment => payment.isDefault)?.type === 'credit_card' && (
                                <div className="flex items-center">
                                  {userProfile.paymentMethods.find(payment => payment.isDefault)?.cardType === 'visa' && (
                                    <img 
                                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" 
                                      alt="Visa" 
                                      className="h-8 w-auto mr-3" 
                                    />
                                  )}
                                  {userProfile.paymentMethods.find(payment => payment.isDefault)?.cardType === 'mastercard' && (
                                    <img 
                                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" 
                                      alt="Mastercard" 
                                      className="h-8 w-auto mr-3" 
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">
                                      {userProfile.paymentMethods.find(payment => payment.isDefault)?.cardNumber}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Hết hạn: {userProfile.paymentMethods.find(payment => payment.isDefault)?.cardExpiry}
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {userProfile.paymentMethods.find(payment => payment.isDefault)?.type === 'paypal' && (
                                <div className="flex items-center">
                                  <img 
                                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1280px-PayPal.svg.png" 
                                    alt="PayPal" 
                                    className="h-8 w-auto mr-3" 
                                  />
                                  <div>
                                    <p className="font-medium">PayPal</p>
                                    <p className="text-sm text-gray-600">
                                      {userProfile.paymentMethods.find(payment => payment.isDefault)?.paypalEmail}
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="mt-3 flex justify-end">
                                <button 
                                  className="text-blue-600 flex items-center"
                                  onClick={() => setActiveSection('payment')}
                                >
                                  Quản lý phương thức thanh toán
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Địa chỉ */}
              {activeSection === 'addresses' && (
                <div>
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-medium">Địa chỉ của tôi</h2>
                    <button className="bg-[#b75e41] text-white px-4 py-2 rounded-md hover:bg-[#a34e32]">
                      Thêm địa chỉ mới
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userProfile.addresses.map(address => (
                        <div 
                          key={address.id} 
                          className={`border rounded-lg p-4 ${
                            address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          {address.isDefault && (
                            <div className="mb-2">
                              <span className="text-blue-600 text-sm font-medium bg-blue-100 px-2 py-1 rounded-full">
                                Mặc định
                              </span>
                            </div>
                          )}
                          
                          <p className="font-medium">{address.fullName}</p>
                          <p>{address.street}</p>
                          {address.apartment && <p>{address.apartment}</p>}
                          <p>{address.city}, {address.state} {address.zipCode}</p>
                          <p>{address.country}</p>
                          <p className="mt-2">{address.phone}</p>
                          
                          <div className="mt-4 flex justify-between">
                            <button className="text-blue-600 text-sm">Chỉnh sửa</button>
                            {!address.isDefault && (
                              <button 
                                className="text-blue-600 text-sm"
                                onClick={() => handleSetDefaultAddress(address.id)}
                              >
                                Đặt làm mặc định
                              </button>
                            )}
                            {!address.isDefault && (
                              <button className="text-red-600 text-sm">Xóa</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Phương thức thanh toán */}
              {activeSection === 'payment' && (
                <div>
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-medium">Phương thức thanh toán</h2>
                    <button className="bg-[#b75e41] text-white px-4 py-2 rounded-md hover:bg-[#a34e32]">
                      Thêm phương thức mới
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userProfile.paymentMethods.map(payment => (
                        <div 
                          key={payment.id} 
                          className={`border rounded-lg p-4 ${
                            payment.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          {payment.isDefault && (
                            <div className="mb-2">
                              <span className="text-blue-600 text-sm font-medium bg-blue-100 px-2 py-1 rounded-full">
                                Mặc định
                              </span>
                            </div>
                          )}
                          
                          {payment.type === 'credit_card' && (
                            <div className="flex items-center">
                              {payment.cardType === 'visa' && (
                                <img 
                                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" 
                                  alt="Visa" 
                                  className="h-8 w-auto mr-3" 
                                />
                              )}
                              {payment.cardType === 'mastercard' && (
                                <img 
                                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" 
                                  alt="Mastercard" 
                                  className="h-8 w-auto mr-3" 
                                />
                              )}
                              <div>
                                <p className="font-medium">{payment.cardNumber}</p>
                                <p className="text-sm text-gray-600">Hết hạn: {payment.cardExpiry}</p>
                              </div>
                            </div>
                          )}
                          
                          {payment.type === 'paypal' && (
                            <div className="flex items-center">
                              <img 
                                src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1280px-PayPal.svg.png" 
                                alt="PayPal" 
                                className="h-8 w-auto mr-3" 
                              />
                              <div>
                                <p className="font-medium">PayPal</p>
                                <p className="text-sm text-gray-600">{payment.paypalEmail}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4 flex justify-between">
                            {payment.type === 'credit_card' && (
                              <button className="text-blue-600 text-sm">Cập nhật</button>
                            )}
                            {!payment.isDefault && (
                              <button 
                                className="text-blue-600 text-sm"
                                onClick={() => handleSetDefaultPayment(payment.id)}
                              >
                                Đặt làm mặc định
                              </button>
                            )}
                            {!payment.isDefault && (
                              <button className="text-red-600 text-sm">Xóa</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tùy chọn thông báo */}
              {activeSection === 'preferences' && (
                <div>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-medium">Tùy chọn thông báo</h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="newsletter"
                            type="checkbox"
                            checked={userProfile.preferences.newsletter}
                            onChange={() => handlePreferenceChange('newsletter')}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3">
                          <label htmlFor="newsletter" className="font-medium">Bản tin email</label>
                          <p className="text-gray-600 text-sm">Nhận thông tin về sản phẩm mới, khuyến mãi, và mẹo hữu ích.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="sms-updates"
                            type="checkbox"
                            checked={userProfile.preferences.smsUpdates}
                            onChange={() => handlePreferenceChange('smsUpdates')}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3">
                          <label htmlFor="sms-updates" className="font-medium">Cập nhật qua SMS</label>
                          <p className="text-gray-600 text-sm">Nhận thông báo về tình trạng đơn hàng và thông tin khuyến mãi qua tin nhắn.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="product-recommendations"
                            type="checkbox"
                            checked={userProfile.preferences.productRecommendations}
                            onChange={() => handlePreferenceChange('productRecommendations')}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3">
                          <label htmlFor="product-recommendations" className="font-medium">Đề xuất sản phẩm</label>
                          <p className="text-gray-600 text-sm">Nhận đề xuất sản phẩm dựa trên lịch sử mua hàng và sở thích của bạn.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="font-medium mb-3">Tùy chọn riêng tư</h3>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        Bạn có thể tùy chỉnh thêm tùy chọn riêng tư và dữ liệu trong phần Cài đặt tài khoản. Chúng tôi sẽ chỉ sử dụng thông tin của bạn theo 
                        <a href="#" className="text-blue-600 hover:underline"> Chính sách bảo mật</a> của chúng tôi.
                      </p>
                      
                      <button className="text-blue-600 text-sm">Quản lý dữ liệu của tôi</button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Bảo mật tài khoản */}
              {activeSection === 'security' && (
                <div>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-medium">Bảo mật tài khoản</h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-3">Đổi mật khẩu</h3>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                              Mật khẩu hiện tại
                            </label>
                            <input
                              type="password"
                              id="current-password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                              Mật khẩu mới
                            </label>
                            <input
                              type="password"
                              id="new-password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                              Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.
                            </p>
                          </div>
                          
                          <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                              Xác nhận mật khẩu mới
                            </label>
                            <input
                              type="password"
                              id="confirm-password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <button className="bg-[#b75e41] text-white px-4 py-2 rounded-md hover:bg-[#a34e32]">
                              Cập nhật mật khẩu
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t border-gray-200">
                        <h3 className="font-medium mb-3">Phiên đăng nhập gần đây</h3>
                        <div className="space-y-3">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">Chrome trên Windows</p>
                                <p className="text-sm text-gray-600">TP. Hồ Chí Minh, Việt Nam - Hiện tại</p>
                              </div>
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Hoạt động</span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">Safari trên iPhone</p>
                                <p className="text-sm text-gray-600">TP. Hồ Chí Minh, Việt Nam - 2 ngày trước</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t border-gray-200">
                        <h3 className="font-medium mb-3">Xác thực hai yếu tố</h3>
                        <p className="text-gray-600 mb-3">
                          Bảo vệ tài khoản của bạn với một lớp bảo mật bổ sung. Khi được kích hoạt, bạn sẽ cần cung cấp mã xác minh khi đăng nhập.
                        </p>
                        <button className="text-blue-600 flex items-center">
                          Kích hoạt xác thực hai yếu tố
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;