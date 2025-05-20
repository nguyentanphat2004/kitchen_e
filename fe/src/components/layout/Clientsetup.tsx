import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, User, Menu, X, ChevronLeft, ChevronRight, Heart, Instagram, Facebook, Twitter } from 'lucide-react';

// Định nghĩa kiểu dữ liệu
interface ProductType {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  image: string;
  colors: string[];
  badge?: string;
  variant?: string;
}

interface CartItemType {
  id: string;
  name: string;
  price: number;
  variant: string;
  image: string;
  quantity: number;
}

interface CategoryProps {
  title: string;
  image: string;
}

interface ProductCardProps {
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  image: string;
  colors: string[];
  badge?: string;
  addToCart: (product: CartItemType) => void;
}

interface ReviewCardProps {
  name: string;
  date: string;
  title: string;
  text: string;
  rating: number;
}

// Main App Component
const Clientsetup: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showPromotion, setShowPromotion] = useState<boolean>(true);
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [showCart, setShowCart] = useState<boolean>(false);
  
  const addToCart = (product: CartItemType): void => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(
        cartItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      );
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };
  
  const removeFromCart = (id: string): void => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };
  
  const updateQuantity = (id: string, quantity: number): void => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(
      cartItems.map(item => 
        item.id === id 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return (
    <div className="min-h-screen bg-[#f8f5f2] text-gray-800 font-sans">
      {/* Thông báo Cookie Consent */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t z-50 px-4 py-3 flex justify-between items-center text-sm">
        <p className="text-xs md:text-sm">Our Place và các nhà cung cấp của chúng tôi sử dụng cookies và các công nghệ theo dõi khác để thu thập dữ liệu nhằm cải thiện và phân tích trải nghiệm trang web của bạn.</p>
        <div className="flex items-center gap-2">
          <button className="text-xs underline">Quản lý Cookies</button>
          <button className="bg-gray-800 text-white px-3 py-1 rounded-md text-xs">Chấp nhận</button>
        </div>
      </div>
      
      {/* Thanh thông báo ưu đãi */}
      <div className="bg-gray-800 text-white text-center text-sm py-2 px-4 flex justify-between">
        <div>Nhận 460K · Ưu đãi</div>
        <div className="hidden md:flex items-center space-x-6">
          <span>Tiết kiệm 3.4 triệu cho Bộ Nồi Chảo. <span className="underline font-medium">Mua Ngay</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Cửa hàng</span>
          <span>Hỗ trợ</span>
        </div>
      </div>
      
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Menu di động */}
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            {/* Logo */}
            <div className="text-2xl font-serif">
              <h1 className="font-bold">Our Place</h1>
            </div>
            
            {/* Menu trên desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="hover:underline">NỒI CHẢO</a>
              <a href="#" className="hover:underline">DỤNG CỤ NƯỚNG</a>
              <a href="#" className="hover:underline">THIẾT BỊ</a>
              <a href="#" className="hover:underline">BÀN ĂN</a>
              <a href="#" className="hover:underline">DỤNG CỤ BẾP</a>
              <a href="#" className="hover:underline">BỘ SƯU TẬP</a>
            </nav>
            
            {/* Icon tiện ích */}
            <div className="flex items-center space-x-4">
              <button>
                <Search size={20} />
              </button>
              <button>
                <User size={20} />
              </button>
              <button onClick={() => setShowCart(!showCart)} className="relative">
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Menu di động */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Menu</h2>
            <button onClick={() => setIsMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <nav className="space-y-6">
            <a href="#" className="block py-2 border-b">NỒI CHẢO</a>
            <a href="#" className="block py-2 border-b">DỤNG CỤ NƯỚNG</a>
            <a href="#" className="block py-2 border-b">THIẾT BỊ</a>
            <a href="#" className="block py-2 border-b">BÀN ĂN</a>
            <a href="#" className="block py-2 border-b">DỤNG CỤ BẾP</a>
            <a href="#" className="block py-2 border-b">BỘ SƯU TẬP</a>
            <a href="#" className="block py-2 border-b">Tài khoản</a>
            <a href="#" className="block py-2 border-b">Hỗ trợ</a>
            <a href="#" className="block py-2 border-b">Cửa hàng</a>
          </nav>
        </div>
      )}
      
      {/* Giỏ hàng */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Giỏ hàng của bạn {totalItems > 0 ? `(${totalItems} sản phẩm)` : ""}</h2>
              <button onClick={() => setShowCart(false)}>
                <X size={24} />
              </button>
            </div>
            
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="mb-4">Giỏ hàng của bạn đang trống</p>
                <button 
                  className="bg-[#b75e41] text-white px-6 py-3 rounded-md"
                  onClick={() => setShowCart(false)}
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            ) : (
              <>
                <div className="border-t border-b py-2 mb-4">
                  <p className="text-green-600 text-sm">Chúc mừng! Bạn được miễn phí vận chuyển tiêu chuẩn</p>
                </div>
                
                {cartItems.map(item => (
                  <div key={item.id} className="flex border-b py-4">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover mr-4" />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-gray-500 text-sm">{item.variant}</p>
                      <div className="flex items-center mt-2">
                        <button 
                          className="border rounded-md px-2"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="mx-2">{item.quantity}</span>
                        <button 
                          className="border rounded-md px-2"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.price.toLocaleString()}₫</p>
                      <button 
                        className="text-gray-500 text-sm underline mt-2"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between">
                    <span>Tổng phụ</span>
                    <span className="font-medium">{subtotal.toLocaleString()}₫</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Phí vận chuyển</span>
                    <span>Được tính khi thanh toán</span>
                  </div>
                  <button className="w-full bg-[#b75e41] text-white py-3 rounded-md font-medium">
                    Thanh toán
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Banner chính */}
      <section className="relative bg-[#e8e0d7] overflow-hidden">
        <div className="container mx-auto px-4 py-12 md:py-24">
          <div className="md:flex md:items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">Nồi Chảo Đa Năng Biểu Tượng</h2>
              <p className="text-lg mb-6">Sản phẩm nhà bếp nổi bật, hiệu quả, không chứa hóa chất độc hại.</p>
              <button className="bg-[#b75e41] text-white px-6 py-3 rounded-md">
                MUA NGAY
              </button>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://i.imgur.com/1hDUYym.jpg" 
                alt="Bộ sưu tập Always Pan" 
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Danh mục nổi bật */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CategoryCard 
              title="Nồi Chảo" 
              image="https://i.imgur.com/CXBkVJW.jpg"
            />
            <CategoryCard 
              title="Thiết Bị" 
              image="https://i.imgur.com/A3Wndnf.jpg"
            />
            <CategoryCard 
              title="Bàn Ăn" 
              image="https://i.imgur.com/9RklDJh.jpg"
            />
            <CategoryCard 
              title="Bộ Sản Phẩm" 
              image="https://i.imgur.com/xKtDWgr.jpg"
            />
          </div>
        </div>
      </section>
      
      {/* Sản phẩm bán chạy */}
      <section className="py-12 bg-[#f8f5f2]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-serif font-bold">Mua Sản Phẩm Bán Chạy</h2>
            <div className="flex space-x-2">
              <button className="border border-gray-300 rounded-full p-2">
                <ChevronLeft size={20} />
              </button>
              <button className="border border-gray-300 rounded-full p-2">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductCard 
              name="Bộ Nồi Chảo"
              description="Bộ 13 món Always Pan và Perfect Pot"
              price={11500000}
              salePrice={8000000}
              image="https://i.imgur.com/WLUKr0K.jpg"
              colors={["#e5deda", "#e49a76", "#93b0c4", "#c4c9cf", "#3c444c"]}
              badge="TIẾT KIỆM 3,5TR"
              addToCart={addToCart}
            />
            
            <ProductCard 
              name="Always Pan 2.0"
              description="Chảo chống dính đa năng 10-trong-1"
              price={2970000}
              image="https://i.imgur.com/R7Hni84.jpg"
              colors={["#3c444c", "#93b0c4", "#6a7a75", "#e49a76", "#e5deda"]}
              badge="BÁN CHẠY NHẤT"
              addToCart={addToCart}
            />
            
            <ProductCard 
              name="Bộ Nồi Chảo Titanium Pro"
              description="Bộ nồi chảo đầy đủ bằng titanium hiệu suất cao"
              price={14800000}
              salePrice={11400000}
              image="https://i.imgur.com/UmyP7bB.jpg"
              colors={["#e5deda", "#cda477"]}
              badge="TIẾT KIỆM 3,4TR"
              addToCart={addToCart}
            />
            
            <ProductCard 
              name="Chảo Titanium Always Pan"
              description="Chảo chống dính chất lượng cao"
              price={4120000}
              image="https://i.imgur.com/9G6HGi5.jpg"
              colors={["#e5deda", "#cda477"]}
              badge="BÁN CHẠY NHẤT"
              addToCart={addToCart}
            />
          </div>
        </div>
      </section>
      
      {/* Đặc điểm sản phẩm */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center md:text-left">
              <div className="flex justify-center md:justify-start items-center mb-4">
                <img src="https://i.imgur.com/fD3wIJb.jpg" alt="Biểu tượng" className="w-12 h-12 mr-2" />
                <h3 className="text-xl font-medium">Thiết Kế Đa Năng Độc Quyền</h3>
              </div>
              <p className="text-gray-600">Tiết kiệm tiền và không gian tủ bếp với các sản phẩm được thiết kế để làm mọi việc và hơn thế nữa.</p>
              <div className="mt-6">
                <img src="https://i.imgur.com/JYD8WVS.jpg" alt="Thiết kế đa năng" className="w-full h-auto rounded-lg" />
              </div>
            </div>
            
            <div className="text-center md:text-left">
              <div className="flex justify-center md:justify-start items-center mb-4">
                <img src="https://i.imgur.com/Rlc01kG.jpg" alt="Biểu tượng Trái đất" className="w-12 h-12 mr-2" />
                <h3 className="text-xl font-medium">Tốt Hơn Cho Trái Đất Chung Của Chúng Ta</h3>
              </div>
              <p className="text-gray-600">Được làm từ 100% nhôm tái chế sau tiêu dùng và không chứa chất độc hại tiềm ẩn.</p>
              <div className="mt-6">
                <img src="https://i.imgur.com/P2YTSM0.jpg" alt="Thiết kế thân thiện với môi trường" className="w-full h-auto rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Đánh giá khách hàng */}
      <section className="py-12 bg-[#f8f5f2]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="flex justify-center">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className="text-yellow-500 text-2xl">★</span>
              ))}
            </div>
            <h2 className="text-2xl font-serif font-bold mt-2">Hơn 80.000 đánh giá 5 sao</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReviewCard 
              name="Marina X."
              date="19/05/25"
              title="Rất thích"
              text="Kích thước hoàn hảo và trọng lượng tuyệt vời"
              rating={5}
            />
            
            <ReviewCard 
              name="Nancy B."
              date="19/05/25"
              title="Nồi này rất tốt cho"
              text="Nồi này rất tốt cho các loại nước sốt như sốt mì Ý"
              rating={5}
            />
            
            <ReviewCard 
              name="Monica M."
              date="19/05/25"
              title="Sản phẩm tuyệt vời"
              text="Tôi đã tìm kiếm chảo mới và tình cờ phát hiện Our Place. Tôi đã mua một chiếc chảo cho mình và một chảo gang cho con trai. Tôi đang muốn mua thêm vỉ nướng gang cho mình. Nấu tốt và dễ làm sạch!"
              rating={5}
            />
          </div>
        </div>
      </section>
      
      {/* Chân trang */}
      <footer className="bg-[#475569] text-white pt-12 pb-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Giữ liên lạc</h3>
              <div className="flex mb-4">
                <input 
                  type="email" 
                  placeholder="Địa chỉ Email" 
                  className="bg-transparent border-b border-white py-2 px-4 text-white placeholder-gray-300 flex-grow focus:outline-none"
                />
                <button className="ml-2 border border-white p-2">→</button>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Bằng cách đăng ký, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật của chúng tôi. Bạn có thể hủy đăng ký bất cứ lúc nào.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="border border-white rounded-full p-2">
                  <Instagram size={16} />
                </a>
                <a href="#" className="border border-white rounded-full p-2">
                  <Facebook size={16} />
                </a>
                <a href="#" className="border border-white rounded-full p-2">
                  <Twitter size={16} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">SẢN PHẨM</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:underline">Always Pan</a></li>
                <li><a href="#" className="hover:underline">Nồi Chảo</a></li>
                <li><a href="#" className="hover:underline">Bàn Ăn</a></li>
                <li><a href="#" className="hover:underline">Dụng Cụ Bếp</a></li>
                <li><a href="#" className="hover:underline">Bộ Sưu Tập</a></li>
                <li><a href="#" className="hover:underline">Quà Tặng</a></li>
                <li><a href="#" className="hover:underline">Bộ Sản Phẩm</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">CÔNG TY</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:underline">Sứ Mệnh</a></li>
                <li><a href="#" className="hover:underline">Chương Trình Tái Chế</a></li>
                <li><a href="#" className="hover:underline">Blog</a></li>
                <li><a href="#" className="hover:underline">Bán Hàng Doanh Nghiệp</a></li>
                <li><a href="#" className="hover:underline">Đối Tác Liên Kết</a></li>
                <li><a href="#" className="hover:underline">Cơ Hội Nghề Nghiệp</a></li>
                <li><a href="#" className="hover:underline">Báo Chí</a></li>
                <li><a href="#" className="hover:underline">Vị Trí Cửa Hàng</a></li>
                <li><a href="#" className="hover:underline">Đánh Giá</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">HỖ TRỢ</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:underline">Câu Hỏi Thường Gặp</a></li>
                <li><a href="#" className="hover:underline">Liên Hệ</a></li>
                <li><a href="#" className="hover:underline">Trả Hàng</a></li>
                <li><a href="#" className="hover:underline">Bảo Hành</a></li>
                <li><a href="#" className="hover:underline">Minh Bạch Chuỗi Cung Ứng</a></li>
                <li><a href="#" className="hover:underline">Trả Góp</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-6">
            <div className="flex flex-col md:flex-row md:justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p>© Our Place 2025</p>
              </div>
              <div className="flex space-x-4 text-sm">
                <a href="#" className="hover:underline">Bản quyền</a>
                <a href="#" className="hover:underline">Riêng tư</a>
                <a href="#" className="hover:underline">Điều khoản</a>
                <a href="#" className="hover:underline">Khả năng tiếp cận</a>
                <a href="#" className="hover:underline">Công bố California AB1300</a>
                <a href="#" className="hover:underline">Cài đặt Cookie</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Component hiển thị danh mục
const CategoryCard: React.FC<CategoryProps> = ({ title, image }) => {
  return (
    <div className="group">
      <div className="relative overflow-hidden rounded-lg mb-3">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <h3 className="text-lg font-medium text-center">{title}</h3>
    </div>
  );
};

// Component hiển thị sản phẩm
const ProductCard: React.FC<ProductCardProps> = ({ 
  name, 
  description, 
  price, 
  salePrice, 
  image, 
  colors, 
  badge, 
  addToCart 
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(colors[0]);
  
  const handleAddToCart = (): void => {
    addToCart({
      id: Math.random().toString(36).substring(2, 9),
      name,
      price: salePrice || price,
      variant: `Màu: ${selectedColor}`,
      image,
      quantity: 1
    });
  };
  
  return (
    <div className="bg-white p-4 rounded-lg">
      {badge && (
        <div className="inline-block bg-gray-800 text-white text-xs px-2 py-1 mb-3">
          {badge}
        </div>
      )}
      
      <div className="relative mb-4 bg-[#f8f6f3] rounded-lg">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-48 object-contain"
        />
        <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500">
          <Heart size={20} />
        </button>
      </div>
      
      <h3 className="font-medium mb-1">{name}</h3>
      <p className="text-gray-500 text-sm mb-2">{description}</p>
      
      <div className="flex space-x-2 mb-4">
        {colors.map(color => (
          <button 
            key={color}
            className={`w-5 h-5 rounded-full ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          {salePrice ? (
            <div className="flex items-center">
              <span className="font-medium text-red-600">{salePrice.toLocaleString()}₫</span>
              <span className="text-gray-500 line-through ml-2">{price.toLocaleString()}₫</span>
            </div>
          ) : (
            <span className="font-medium">{price.toLocaleString()}₫</span>
          )}
        </div>
        
        <button 
          className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm"
          onClick={handleAddToCart}
        >
          Thêm
        </button>
      </div>
    </div>
  );
};

// Component hiển thị đánh giá
const ReviewCard: React.FC<ReviewCardProps> = ({ name, date, title, text, rating }) => {
  return (
    <div className="bg-white p-6 rounded-lg">
      <div className="flex items-center mb-4">
        {[...Array(rating)].map((_, i) => (
          <span key={i} className="text-yellow-500">★</span>
        ))}
        {[...Array(5 - rating)].map((_, i) => (
          <span key={i} className="text-gray-300">★</span>
        ))}
      </div>
      
      <h3 className="font-medium text-lg mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{text}</p>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="font-medium">{name}</div>
        <div>{date}</div>
      </div>
    </div>
  );
};

export default Clientsetup;