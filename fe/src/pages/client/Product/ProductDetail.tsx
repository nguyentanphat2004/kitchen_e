import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, StarHalf, MessageCircle, Heart, ShoppingBag, Check, Play, Info, ArrowRight, Plus, Minus } from 'lucide-react';

// Định nghĩa kiểu dữ liệu
interface ProductVariant {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  colorCode: string;
  images: string[];
  inStock: boolean;
}

interface ProductDetailProps {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  variants: ProductVariant[];
  features: string[];
  specifications: { [key: string]: string };
  addToCart: (product: any) => void;
}

// Component trang chi tiết sản phẩm
const ProductDetail: React.FC<ProductDetailProps> = ({ 
  id, 
  name, 
  subtitle, 
  description, 
  rating, 
  reviewCount, 
  price, 
  originalPrice, 
  discount,
  variants, 
  features, 
  specifications, 
  addToCart 
}) => {
  // State
  const [selectedSize, setSelectedSize] = useState<string>(variants[0]?.size || '');
  const [selectedColor, setSelectedColor] = useState<string>(variants[0]?.colorCode || '');
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('details');
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({
    'whatsIncluded': false,
    'details': false,
    'careAndUse': false,
    'reviews': false,
  });

  // Tìm variant hiện tại dựa trên kích thước và màu sắc được chọn
  const currentVariant = variants.find(
    v => v.size === selectedSize && v.colorCode === selectedColor
  ) || variants[0];

  // Lấy danh sách kích thước riêng biệt
  const availableSizes = Array.from(new Set(variants.map(v => v.size)));
  
  // Lấy danh sách màu sắc cho kích thước đã chọn
  const availableColors = variants
    .filter(v => v.size === selectedSize)
    .map(v => ({ name: v.color, code: v.colorCode }));

  // Xử lý khi thay đổi kích thước
  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    
    // Kiểm tra xem màu sắc hiện tại có khả dụng cho kích thước mới không
    const colorsForSize = variants
      .filter(v => v.size === size)
      .map(v => v.colorCode);
    
    if (!colorsForSize.includes(selectedColor)) {
      setSelectedColor(colorsForSize[0]);
    }
    
    // Reset hình ảnh về trang đầu tiên
    setCurrentImageIndex(0);
  };

  // Xử lý khi thay đổi màu sắc
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setCurrentImageIndex(0); // Reset hình ảnh về trang đầu tiên
  };

  // Xử lý khi thay đổi số lượng
  const handleQuantityChange = (value: number) => {
    if (value >= 1) {
      setQuantity(value);
    }
  };

  // Xử lý khi thêm vào giỏ hàng
  const handleAddToCart = () => {
    addToCart({
      id: currentVariant.id,
      name: name,
      variant: `${currentVariant.size}, ${currentVariant.color}`,
      price: price,
      image: currentVariant.images[0],
      quantity: quantity
    });
  };

  // Xử lý khi chuyển hình ảnh
  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex(prevIndex => 
        prevIndex === 0 ? currentVariant.images.length - 1 : prevIndex - 1
      );
    } else {
      setCurrentImageIndex(prevIndex => 
        prevIndex === currentVariant.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  // Xử lý mở rộng/thu gọn phần
  const toggleSection = (section: string) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4 text-sm">
        <nav className="flex items-center space-x-2 text-gray-600">
          <a href="/" className="hover:underline">Trang chủ</a>
          <span>/</span>
          <a href="/noi-chao" className="hover:underline">Nồi Chảo</a>
          <span>/</span>
          <a href="/always-pans" className="hover:underline">Always Pans</a>
          <span>/</span>
          <span className="text-gray-900 font-medium">{name}</span>
        </nav>
      </div>

      {/* Thông tin sản phẩm chính */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Phần hình ảnh sản phẩm */}
          <div className="lg:w-3/5">
            <div className="relative">
              {/* Khung hình ảnh chính */}
              <div className="bg-[#f8f6f3] rounded-lg p-8 mb-4 relative overflow-hidden">
                <img 
                  src={currentVariant.images[currentImageIndex]} 
                  alt={`${name} - ${currentVariant.color}`}
                  className="w-full h-auto object-contain mx-auto"
                />
                <div className="absolute bottom-0 right-0 p-4">
                  <button 
                    className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md"
                    title="Xem video sản phẩm"
                  >
                    <Play size={20} />
                  </button>
                </div>
              </div>

              {/* Nút điều hướng hình ảnh */}
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full flex justify-between px-2">
                <button 
                  className="bg-white rounded-full p-2 shadow-md"
                  onClick={() => handleImageNavigation('prev')}
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  className="bg-white rounded-full p-2 shadow-md"
                  onClick={() => handleImageNavigation('next')}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Thumbnail các hình ảnh */}
              <div className="flex justify-center mt-4 space-x-2">
                {currentVariant.images.map((img, idx) => (
                  <button 
                    key={idx}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                      idx === currentImageIndex ? 'border-gray-800' : 'border-transparent'
                    }`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <img 
                      src={img} 
                      alt={`${name} - thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Phần thông tin sản phẩm */}
          <div className="lg:w-2/5">
            {/* Badge "Bestseller" */}
            <div className="inline-block bg-[#435547] text-white text-xs uppercase tracking-wider px-3 py-1 mb-4">
              Bán chạy nhất
            </div>

            {/* Thông tin chính */}
            <h1 className="text-3xl font-serif font-bold mb-1">{name}</h1>
            <p className="text-lg mb-3">{subtitle}</p>

            {/* Đánh giá */}
            <div className="flex items-center mb-4">
              <div className="flex">
                {[...Array(Math.floor(rating))].map((_, i) => (
                  <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                ))}
                {rating % 1 !== 0 && (
                  <StarHalf size={16} fill="#f59e0b" color="#f59e0b" />
                )}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                ({reviewCount.toLocaleString()} đánh giá)
              </span>
            </div>

            {/* Giá */}
            <div className="flex items-center mb-6">
              <span className="text-2xl font-medium">{price.toLocaleString()}₫</span>
              {originalPrice && (
                <span className="ml-2 text-gray-500 line-through">{originalPrice.toLocaleString()}₫</span>
              )}
              {discount && (
                <span className="ml-2 text-red-600">(-{discount}%)</span>
              )}
            </div>

            {/* Kích thước */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Kích thước:</h3>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => (
                  <button
                    key={size}
                    className={`border px-4 py-2 rounded-md ${
                      selectedSize === size
                        ? 'border-gray-800 bg-gray-100'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleSizeChange(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Màu sắc */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Màu sắc:</h3>
                <span className="text-gray-600">{currentVariant.color}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {availableColors.map(color => (
                  <button
                    key={color.code}
                    className={`w-9 h-9 rounded-full ${
                      selectedColor === color.code 
                        ? 'ring-2 ring-offset-2 ring-gray-800' 
                        : ''
                    }`}
                    style={{ backgroundColor: color.code }}
                    onClick={() => handleColorChange(color.code)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Số lượng */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Số lượng:</h3>
              <div className="flex items-center border border-gray-300 rounded-md w-32">
                <button 
                  className="px-3 py-2"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus size={16} className={quantity <= 1 ? "text-gray-300" : "text-gray-600"} />
                </button>
                <span className="flex-1 text-center">{quantity}</span>
                <button 
                  className="px-3 py-2"
                  onClick={() => handleQuantityChange(quantity + 1)}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Nút mua hàng */}
            <div className="mb-6">
              <button
                className="w-full bg-[#b75e41] text-white py-3 rounded-md font-medium mb-3"
                onClick={handleAddToCart}
              >
                THÊM VÀO GIỎ HÀNG
              </button>
              <button className="w-full border border-gray-300 py-3 rounded-md font-medium flex items-center justify-center">
                <Heart size={18} className="mr-2" />
                THÊM VÀO YÊU THÍCH
              </button>
            </div>

            {/* Thanh toán trả góp */}
            <div className="border-t border-b py-4 mb-6">
              <p className="text-sm mb-1">
                Từ {(price / 4).toLocaleString()}₫/tháng hoặc 4 lần thanh toán với lãi suất 0% qua Klarna. <a href="#" className="underline text-blue-600">Tìm hiểu thêm</a>
              </p>
            </div>

            {/* Tính năng nổi bật */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Tại sao bạn sẽ yêu thích nó</h3>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check size={16} className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin chi tiết sản phẩm */}
      <div className="container mx-auto px-4 py-8 border-t">
        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex flex-wrap -mb-px">
            <button
              className={`mr-8 pb-4 font-medium ${
                activeTab === 'details'
                  ? 'border-b-2 border-gray-800 text-gray-800'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Thông tin chi tiết
            </button>
            <button
              className={`mr-8 pb-4 font-medium ${
                activeTab === 'whatsIncluded'
                  ? 'border-b-2 border-gray-800 text-gray-800'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('whatsIncluded')}
            >
              Sản phẩm bao gồm
            </button>
            <button
              className={`mr-8 pb-4 font-medium ${
                activeTab === 'careAndUse'
                  ? 'border-b-2 border-gray-800 text-gray-800'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('careAndUse')}
            >
              Hướng dẫn sử dụng
            </button>
            <button
              className={`pb-4 font-medium ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-gray-800 text-gray-800'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('reviews')}
            >
              Đánh giá ({reviewCount})
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="prose max-w-none">
          {activeTab === 'details' && (
            <div>
              <h3>Thông số kỹ thuật</h3>
              <p>
                Đủ sâu để nướng một con gà, đủ nông để lật trứng, Always Pan 2.0 là tiêu chuẩn vàng cho tính linh hoạt, thực hiện công việc của mười món đồ nấu ăn truyền thống.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div>
                  <h4>Tính năng</h4>
                  <ul>
                    <li>Chảo 10-trong-1 đa năng</li>
                    <li>Chống dính không gây hại</li>
                    <li>Xử lý nhiệt nhanh và đều</li>
                    <li>Tay cầm thiết kế công thái học</li>
                    <li>Tương thích với tất cả các loại bếp</li>
                    <li>Có thể sử dụng trong lò nướng đến 230°C</li>
                  </ul>
                </div>
                <div>
                  <h4>Thông số kỹ thuật</h4>
                  <table className="w-full">
                    <tbody>
                      {Object.entries(specifications).map(([key, value]) => (
                        <tr key={key} className="border-b">
                          <td className="py-2 pr-4 text-gray-600">{key}</td>
                          <td className="py-2">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <h3>Lợi ích chính</h3>
              <p>
                Chảo Always Pan 2.0 được chế tạo từ nhôm tái chế sau tiêu dùng và lớp phủ chống dính không chứa PFAS, đảm bảo an toàn cho bạn và môi trường. Lớp phủ chống dính Thermalink™ độc quyền của chúng tôi kéo dài hơn 50% so với các loại chảo thông thường, giúp bạn nấu ăn dễ dàng và cũng dễ dàng làm sạch.
              </p>
            </div>
          )}

          {activeTab === 'whatsIncluded' && (
            <div>
              <h3>Trong hộp có gì?</h3>
              <div className="flex flex-col md:flex-row md:items-center gap-8 my-6">
                <img
                  src="https://i.imgur.com/R7Hni84.jpg"
                  alt="Always Pan 2.0 Components"
                  className="w-full md:w-1/2 h-auto rounded-lg"
                />
                <div>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check size={16} className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>1x Always Pan 2.0</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={16} className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>1x Nắp kính cường lực</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={16} className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>1x Giỏ hấp bằng thép không gỉ</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={16} className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>1x Thìa gỗ đặc biệt có thể gắn vào tay cầm</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={16} className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>1x Sách hướng dẫn sử dụng và bảo quản</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <p>
                Mỗi Always Pan 2.0 đều được thiết kế để hoạt động như 10 dụng cụ nấu ăn khác nhau, giúp bạn tiết kiệm không gian tủ bếp và tiền bạc. Với một chiếc chảo, bạn có thể:
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Rán</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Xào</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Hấp</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Luộc</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Chiên ngập dầu</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Nấu súp</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Làm nước sốt</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Nấu cơm</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Nướng trong lò</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'careAndUse' && (
            <div>
              <h3>Hướng dẫn sử dụng và bảo quản</h3>
              
              <div className="my-6 space-y-6">
                <div>
                  <h4 className="text-lg font-medium mb-2">Trước lần sử dụng đầu tiên</h4>
                  <p>Rửa sạch chảo và các phụ kiện bằng xà phòng rửa chén nhẹ và nước ấm. Lau khô hoàn toàn.</p>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-2">Làm thế nào để nấu</h4>
                  <ol className="space-y-2 list-decimal list-inside">
                    <li>Luôn sử dụng một ít dầu hoặc chất béo khi nấu ăn để bảo vệ bề mặt chống dính.</li>
                    <li>Chỉ sử dụng nhiệt thấp đến trung bình - không bao giờ sử dụng nhiệt độ cao vì có thể làm hỏng lớp phủ chống dính.</li>
                    <li>Để đạt hiệu quả tốt nhất, hãy làm nóng chảo từ từ trước khi thêm dầu.</li>
                    <li>Tránh sử dụng dụng cụ kim loại sắc nhọn để bảo vệ bề mặt chống dính.</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-2">Làm thế nào để vệ sinh</h4>
                  <ul className="space-y-2">
                    <li>Để nguội chảo trước khi vệ sinh.</li>
                    <li>Rửa bằng tay với xà phòng rửa chén nhẹ và nước ấm.</li>
                    <li>Sử dụng miếng bọt biển mềm hoặc khăn để làm sạch.</li>
                    <li>Không sử dụng bột cọ rửa, miếng cọ rửa kim loại, hoặc chất tẩy rửa mạnh.</li>
                    <li>An toàn với máy rửa chén, nhưng chúng tôi khuyên bạn nên rửa tay để kéo dài tuổi thọ của chảo.</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-2">Bảo quản</h4>
                  <p>Bảo quản ở nơi khô ráo. Nếu xếp chồng, hãy đặt khăn giấy hoặc miếng lót mềm giữa các chảo để tránh làm xước.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-medium mb-2">Lưu ý quan trọng</h4>
                <ul className="space-y-2">
                  <li>Không đặt chảo nóng vào nước lạnh - có thể gây biến dạng.</li>
                  <li>Luôn để chảo nguội trước khi vệ sinh.</li>
                  <li>Tay cầm có thể nóng khi sử dụng trong lò nướng - luôn sử dụng găng tay cách nhiệt khi cầm nắm.</li>
                  <li>Không sử dụng trên bếp lửa trực tiếp (bếp gas ngoài trời).</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-5xl font-bold mb-2">{rating}</div>
                    <div className="flex justify-center mb-2">
                      {[...Array(Math.floor(rating))].map((_, i) => (
                        <Star key={i} size={20} fill="#f59e0b" color="#f59e0b" />
                      ))}
                      {rating % 1 !== 0 && (
                        <StarHalf size={20} fill="#f59e0b" color="#f59e0b" />
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{reviewCount} đánh giá</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="w-8 text-right mr-2">5</span>
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-yellow-500 h-full rounded-full" style={{ width: '81%' }}></div>
                        </div>
                        <span className="w-12 text-right ml-2 text-sm text-gray-600">81%</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-8 text-right mr-2">4</span>
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-yellow-500 h-full rounded-full" style={{ width: '8%' }}></div>
                        </div>
                        <span className="w-12 text-right ml-2 text-sm text-gray-600">8%</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-8 text-right mr-2">3</span>
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-yellow-500 h-full rounded-full" style={{ width: '4%' }}></div>
                        </div>
                        <span className="w-12 text-right ml-2 text-sm text-gray-600">4%</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-8 text-right mr-2">2</span>
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-yellow-500 h-full rounded-full" style={{ width: '3%' }}></div>
                        </div>
                        <span className="w-12 text-right ml-2 text-sm text-gray-600">3%</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-8 text-right mr-2">1</span>
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-yellow-500 h-full rounded-full" style={{ width: '4%' }}></div>
                        </div>
                        <span className="w-12 text-right ml-2 text-sm text-gray-600">4%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <div className="mb-6">
                    <h3 className="text-xl font-medium mb-2">Viết đánh giá</h3>
                    <button className="bg-gray-800 text-white px-6 py-2 rounded-md">
                      Viết đánh giá
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Đánh giá mẫu */}
                    <div className="border-b pb-6">
                      <div className="flex items-center mb-2">
                        <div className="flex mr-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                          ))}
                        </div>
                        <span className="font-medium">Marina X.</span>
                        <span className="mx-2">·</span>
                        <span className="text-gray-600">19/05/25</span>
                      </div>
                      <h4 className="font-medium mb-2">Rất thích!</h4>
                      <p>Kích thước hoàn hảo và trọng lượng tuyệt vời. Tôi dùng nó mỗi ngày và thực sự yêu thích mặt chống dính.</p>
                    </div>
                    
                    <div className="border-b pb-6">
                      <div className="flex items-center mb-2">
                        <div className="flex mr-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                          ))}
                        </div>
                        <span className="font-medium">Nancy B.</span>
                        <span className="mx-2">·</span>
                        <span className="text-gray-600">19/05/25</span>
                      </div>
                      <h4 className="font-medium mb-2">Nồi này rất tốt cho các loại nước sốt</h4>
                      <p>Nồi này rất tốt cho các loại nước sốt như sốt mì Ý. Dễ lau chùi và phân bố nhiệt rất đều.</p>
                    </div>
                    
                    <div className="pb-6">
                      <div className="flex items-center mb-2">
                        <div className="flex mr-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                          ))}
                        </div>
                        <span className="font-medium">Monica M.</span>
                        <span className="mx-2">·</span>
                        <span className="text-gray-600">19/05/25</span>
                      </div>
                      <h4 className="font-medium mb-2">Sản phẩm tuyệt vời</h4>
                      <p>Tôi đã tìm kiếm chảo mới và tình cờ phát hiện Our Place. Tôi đã mua một chiếc chảo cho mình và một chảo gang cho con trai. Tôi đang muốn mua thêm vỉ nướng gang cho mình. Nấu tốt và dễ làm sạch!</p>
                    </div>
                    
                    <button className="text-blue-600 font-medium flex items-center">
                      Xem thêm đánh giá
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sản phẩm đề xuất */}
      <div className="bg-[#f8f5f2] py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-serif font-bold mb-6">Bạn cũng có thể thích</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Sản phẩm đề xuất 1 */}
            <div className="bg-white p-4 rounded-lg">
              <div className="relative mb-4 bg-[#f8f6f3] rounded-lg">
                <img 
                  src="https://i.imgur.com/UmyP7bB.jpg" 
                  alt="Bộ Nồi Chảo Titanium Pro" 
                  className="w-full h-48 object-contain"
                />
                <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500">
                  <Heart size={20} />
                </button>
              </div>
              
              <h3 className="font-medium mb-1">Bộ Nồi Chảo Titanium Pro</h3>
              <p className="text-gray-500 text-sm mb-2">Bộ nồi chảo đầy đủ bằng titanium hiệu suất cao</p>
              
              <div className="flex space-x-2 mb-4">
                <button className="w-5 h-5 rounded-full bg-[#e5deda]"></button>
                <button className="w-5 h-5 rounded-full bg-[#cda477]"></button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-medium text-red-600">11.400.000₫</span>
                  <span className="text-gray-500 line-through ml-2">14.800.000₫</span>
                </div>
                <button className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm">
                  Thêm
                </button>
              </div>
            </div>
            
            {/* Sản phẩm đề xuất 2 */}
            <div className="bg-white p-4 rounded-lg">
              <div className="relative mb-4 bg-[#f8f6f3] rounded-lg">
                <img 
                  src="https://i.imgur.com/9G6HGi5.jpg" 
                  alt="Chảo Titanium Always Pan" 
                  className="w-full h-48 object-contain"
                />
                <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500">
                  <Heart size={20} />
                </button>
              </div>
              
              <h3 className="font-medium mb-1">Chảo Titanium Always Pan</h3>
              <p className="text-gray-500 text-sm mb-2">Chảo chống dính chất lượng cao</p>
              
              <div className="flex space-x-2 mb-4">
                <button className="w-5 h-5 rounded-full bg-[#e5deda]"></button>
                <button className="w-5 h-5 rounded-full bg-[#cda477]"></button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">4.120.000₫</span>
                <button className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm">
                  Thêm
                </button>
              </div>
            </div>
            
            {/* Sản phẩm đề xuất 3 */}
            <div className="bg-white p-4 rounded-lg">
              <div className="relative mb-4 bg-[#f8f6f3] rounded-lg">
                <img 
                  src="https://i.imgur.com/WLUKr0K.jpg" 
                  alt="Bộ Nồi Chảo" 
                  className="w-full h-48 object-contain"
                />
                <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500">
                  <Heart size={20} />
                </button>
              </div>
              
              <h3 className="font-medium mb-1">Bộ Nồi Chảo</h3>
              <p className="text-gray-500 text-sm mb-2">Bộ 13 món Always Pan và Perfect Pot</p>
              
              <div className="flex space-x-2 mb-4">
                <button className="w-5 h-5 rounded-full bg-[#e5deda]"></button>
                <button className="w-5 h-5 rounded-full bg-[#e49a76]"></button>
                <button className="w-5 h-5 rounded-full bg-[#93b0c4]"></button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-medium text-red-600">8.000.000₫</span>
                  <span className="text-gray-500 line-through ml-2">11.500.000₫</span>
                </div>
                <button className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm">
                  Thêm
                </button>
              </div>
            </div>
            
            {/* Sản phẩm đề xuất 4 */}
            <div className="bg-white p-4 rounded-lg">
              <div className="relative mb-4 bg-[#f8f6f3] rounded-lg">
                <img 
                  src="https://i.imgur.com/CXBkVJW.jpg" 
                  alt="Perfect Pot" 
                  className="w-full h-48 object-contain"
                />
                <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500">
                  <Heart size={20} />
                </button>
              </div>
              
              <h3 className="font-medium mb-1">Perfect Pot</h3>
              <p className="text-gray-500 text-sm mb-2">Nồi đa năng 6-trong-1</p>
              
              <div className="flex space-x-2 mb-4">
                <button className="w-5 h-5 rounded-full bg-[#e5deda]"></button>
                <button className="w-5 h-5 rounded-full bg-[#93b0c4]"></button>
                <button className="w-5 h-5 rounded-full bg-[#6a7a75]"></button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">3.450.000₫</span>
                <button className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm">
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component sử dụng với dữ liệu mẫu
const AlwaysPanProductPage: React.FC = () => {
  const addToCart = (product: any) => {
    console.log('Added to cart:', product);
    // Xử lý thêm vào giỏ hàng ở đây
  };

  const productData = {
    id: 'always-pan-2',
    name: 'Always Pan® 2.0',
    subtitle: 'Chảo đa năng 10-trong-1 bán chạy nhất của chúng tôi',
    description: 'Một hệ thống nấu ăn đa năng làm được tất cả',
    rating: 4.6,
    reviewCount: 38810,
    price: 2970000,
    originalPrice: 3500000,
    discount: 15,
    variants: [
      {
        id: 'ap2-blue-standard',
        name: 'Always Pan 2.0 - Xanh Dương',
        price: 2970000,
        size: 'Tiêu chuẩn (10.5")',
        color: 'Xanh Dương',
        colorCode: '#93b0c4',
        images: [
          'https://i.imgur.com/R7Hni84.jpg',
          'https://i.imgur.com/JYD8WVS.jpg',
          'https://i.imgur.com/P2YTSM0.jpg',
          'https://i.imgur.com/DWQBzZZ.jpg'
        ],
        inStock: true
      },
      {
        id: 'ap2-gray-standard',
        name: 'Always Pan 2.0 - Xám Đá',
        price: 2970000,
        size: 'Tiêu chuẩn (10.5")',
        color: 'Xám Đá',
        colorCode: '#3c444c',
        images: [
          'https://i.imgur.com/9G6HGi5.jpg',
          'https://i.imgur.com/P2YTSM0.jpg',
          'https://i.imgur.com/DWQBzZZ.jpg'
        ],
        inStock: true
      },
      {
        id: 'ap2-green-standard',
        name: 'Always Pan 2.0 - Xanh Lá',
        price: 2970000,
        size: 'Tiêu chuẩn (10.5")',
        color: 'Xanh Lá',
        colorCode: '#6a7a75',
        images: [
          'https://i.imgur.com/WLUKr0K.jpg',
          'https://i.imgur.com/P2YTSM0.jpg',
          'https://i.imgur.com/DWQBzZZ.jpg'
        ],
        inStock: true
      },
      {
        id: 'ap2-cream-standard',
        name: 'Always Pan 2.0 - Kem',
        price: 2970000,
        size: 'Tiêu chuẩn (10.5")',
        color: 'Kem',
        colorCode: '#e5deda',
        images: [
          'https://i.imgur.com/UmyP7bB.jpg',
          'https://i.imgur.com/P2YTSM0.jpg',
          'https://i.imgur.com/DWQBzZZ.jpg'
        ],
        inStock: true
      },
      {
        id: 'ap2-blue-mini',
        name: 'Always Pan 2.0 - Xanh Dương (Mini)',
        price: 2450000,
        size: 'Mini (8.5")',
        color: 'Xanh Dương',
        colorCode: '#93b0c4',
        images: [
          'https://i.imgur.com/R7Hni84.jpg',
          'https://i.imgur.com/JYD8WVS.jpg',
          'https://i.imgur.com/P2YTSM0.jpg'
        ],
        inStock: true
      },
      {
        id: 'ap2-gray-mini',
        name: 'Always Pan 2.0 - Xám Đá (Mini)',
        price: 2450000,
        size: 'Mini (8.5")',
        color: 'Xám Đá',
        colorCode: '#3c444c',
        images: [
          'https://i.imgur.com/9G6HGi5.jpg',
          'https://i.imgur.com/P2YTSM0.jpg'
        ],
        inStock: true
      },
      {
        id: 'ap2-blue-large',
        name: 'Always Pan 2.0 - Xanh Dương (Lớn)',
        price: 3540000,
        size: 'Lớn (12.5")',
        color: 'Xanh Dương',
        colorCode: '#93b0c4',
        images: [
          'https://i.imgur.com/R7Hni84.jpg',
          'https://i.imgur.com/JYD8WVS.jpg',
          'https://i.imgur.com/P2YTSM0.jpg'
        ],
        inStock: true
      }
    ],
    features: [
      'Chảo 10-trong-1 đủ sâu để nướng một con gà, đủ nông để lật trứng',
      'Lớp phủ chống dính Thermalink™ — công nghệ độc quyền, tiên tiến nhất, bền hơn 50%',
      'Làm từ nhôm tái chế 100% không chứa PFAS (PTFE và PFOA), chì và cadmium',
      'An toàn với lò nướng lên đến 230°C, sử dụng được trên mọi loại bếp',
      'Bao gồm thìa gỗ thiết kế riêng và giỏ hấp bằng thép không gỉ'
    ],
    specifications: {
      'Kích thước': 'Đường kính 26.7 cm, độ sâu 7 cm',
      'Trọng lượng': '1.4 kg',
      'Chất liệu': 'Nhôm tái chế, lớp phủ chống dính gốm sứ',
      'Dung tích': '2.7 lít',
      'Xuất xứ': 'Thiết kế tại Mỹ, sản xuất tại Trung Quốc',
      'Bảo hành': '3 năm'
    }
  };

  return <ProductDetail {...productData} addToCart={addToCart} />;
};

export default AlwaysPanProductPage;