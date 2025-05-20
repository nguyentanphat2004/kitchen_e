import React, { useState } from 'react';
import { Search, User, ShoppingBag, ChevronRight } from 'lucide-react';

// Định nghĩa kiểu dữ liệu
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  colors: string[];
  colorNames: {[key: string]: string};
  tags: string[];
}

interface CategoryProps {
  title: string;
  isActive?: boolean;
  isHeading?: boolean;
  indent?: boolean;
  onClick?: () => void;
}

interface ColorOptionProps {
  color: string;
  isSelected?: boolean;
  onClick?: () => void;
}

// Component cho trang danh mục Bakeware
const BakewareCategoryPage: React.FC = () => {
  // State cho danh mục sản phẩm
  const [products] = useState<Product[]>([
    {
      id: 'bakeware-set',
      name: 'Bakeware Set (5 Piece)',
      description: 'A 5-piece set for cooking in your oven and beyond',
      price: 199.95,
      image: 'https://i.imgur.com/JYD8WVS.jpg',
      badge: '$85 SET SAVINGS',
      colors: ['#a32d37', '#3c444c', '#93b0c4', '#6a7a75', '#e5deda', '#e49a76'],
      colorNames: {
        '#a32d37': 'Steam',
        '#3c444c': 'Char',
        '#93b0c4': 'Blue Salt',
        '#6a7a75': 'Sage',
        '#e5deda': 'Spice',
        '#e49a76': 'Terracotta'
      },
      tags: ['CERAMIC NONSTICK', '5 PIECE SET']
    },
    {
      id: 'ultimate-bakeware',
      name: 'Ultimate Bakeware Set (9 piece)',
      description: 'A full suite of versatile bakeware and accessories',
      price: 259.95,
      originalPrice: 344.95,
      image: 'https://i.imgur.com/P2YTSM0.jpg',
      badge: '$85 SET SAVINGS',
      colors: ['#e5deda', '#a3bd9f', '#3c444c', '#e49a76', '#93b0c4'],
      colorNames: {
        '#e5deda': 'Spice',
        '#a3bd9f': 'Sage',
        '#3c444c': 'Char',
        '#e49a76': 'Terracotta',
        '#93b0c4': 'Blue Salt'
      },
      tags: ['BUNDLE & SAVE']
    },
    {
      id: 'bakeware-trio',
      name: 'Bakeware Trio (4 pieces)',
      description: 'A baking, roasting, and griddling starter set',
      price: 179.95,
      originalPrice: 209,
      image: 'https://i.imgur.com/CXBkVJW.jpg',
      badge: '$29 SET SAVINGS',
      colors: ['#3c444c', '#93b0c4', '#e5deda', '#e49a76', '#6a7a75'],
      colorNames: {
        '#3c444c': 'Char',
        '#93b0c4': 'Blue Salt',
        '#e5deda': 'Spice',
        '#e49a76': 'Terracotta',
        '#6a7a75': 'Sage'
      },
      tags: ['BUNDLE & SAVE']
    },
    {
      id: 'hosting-apron',
      name: 'Hosting Apron',
      description: 'Who says an apron can\'t be as pretty as a party dress?',
      price: 50,
      image: 'https://i.imgur.com/A3Wndnf.jpg',
      colors: ['#1e3a8a', '#121212', '#e5c8d6'],
      colorNames: {
        '#1e3a8a': 'Blue',
        '#121212': 'Black',
        '#e5c8d6': 'Pink'
      },
      tags: ['OEKO-TEX®', 'EASY-CARE COTTON']
    },
    {
      id: 'cookware-bakeware',
      name: 'Cookware + Bakeware Set (18 Piece)',
      description: 'An 18-piece Always Pan, Perfect Pot, and Bakeware Set',
      price: 499.95,
      originalPrice: 597.95,
      image: 'https://i.imgur.com/WLUKr0K.jpg',
      badge: '$136 SET SAVINGS',
      colors: ['#e5deda', '#3c444c', '#93b0c4', '#6a7a75', '#e49a76'],
      colorNames: {
        '#e5deda': 'Spice',
        '#3c444c': 'Char',
        '#93b0c4': 'Blue Salt',
        '#6a7a75': 'Sage',
        '#e49a76': 'Terracotta'
      },
      tags: ['BUNDLE & SAVE']
    }
  ]);

  // State cho trạng thái lựa chọn màu sắc
  const [selectedColors, setSelectedColors] = useState<{[key: string]: string}>({
    'bakeware-set': '#a32d37',
    'ultimate-bakeware': '#e5deda',
    'bakeware-trio': '#3c444c',
    'hosting-apron': '#1e3a8a',
    'cookware-bakeware': '#e5deda'
  });

  // Hàm xử lý khi chọn màu sắc
  const handleColorSelect = (productId: string, color: string) => {
    setSelectedColors(prev => ({
      ...prev,
      [productId]: color
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Thanh điều hướng chính */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="text-2xl font-serif">
              <h1 className="font-bold">Our Place</h1>
            </div>
            
            {/* Menu điều hướng chính */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="hover:underline">COOKWARE</a>
              <a href="#" className="font-medium">BAKEWARE</a>
              <a href="#" className="hover:underline">APPLIANCES</a>
              <a href="#" className="hover:underline">TABLEWARE</a>
              <a href="#" className="hover:underline">KITCHEN TOOLS</a>
              <a href="#" className="hover:underline">COLLECTIONS</a>
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
                <span className="absolute -top-1 -right-1 bg-[#a32d37] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  2
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <div className="lg:w-1/5 mb-8 lg:mb-0 pr-8">
            <nav className="space-y-8">
              <div className="space-y-2">
                <CategoryItem title="Shop All" />
                <CategoryItem title="New Arrivals" />
                <CategoryItem title="Bundles" />
              </div>
              
              <div className="space-y-2">
                <CategoryItem title="COOKWARE" isHeading />
                <CategoryItem title="BAKEWARE" isHeading isActive />
                <CategoryItem title="Griddle and Baking Pans" indent />
                <CategoryItem title="Accessories" indent />
                <CategoryItem title="Bundle & Save" indent />
                <CategoryItem title="APPLIANCES" isHeading />
                <CategoryItem title="TABLEWARE" isHeading />
                <CategoryItem title="KITCHEN TOOLS" isHeading />
                <CategoryItem title="COLLECTIONS" isHeading />
              </div>
              
              <div className="space-y-2">
                <CategoryItem title="WE MADE TOO MUCH" isHeading />
                <CategoryItem title="Gift Cards" />
              </div>
            </nav>
          </div>
          
          {/* Main content */}
          <div className="lg:w-4/5">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm mb-6">
              <a href="/" className="text-gray-600 hover:underline">Home</a>
              <ChevronRight size={14} className="mx-1 text-gray-400" />
              <span className="font-medium">Bakeware</span>
            </div>
            
            {/* Hero Banner */}
            <div className="flex flex-col md:flex-row bg-[#f8f8f6] rounded-lg overflow-hidden mb-12">
              <div className="md:w-1/2 p-8 flex flex-col justify-center">
                <h1 className="text-3xl font-serif font-bold mb-4">Bakeware</h1>
                <p className="text-gray-700">
                  Everything you need to reinvent how you cook in your oven, from long roasts to sweet treats.
                </p>
              </div>
              <div className="md:w-1/2">
                <img 
                  src="https://i.imgur.com/9RklDJh.jpg" 
                  alt="Bakeware Collection" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="group">
                  {/* Badge */}
                  {product.badge && (
                    <div className="inline-block bg-gray-800 text-white text-xs px-2 py-1 mb-3">
                      {product.badge}
                    </div>
                  )}
                  
                  {/* Product Image */}
                  <div className="relative bg-[#f8f8f6] rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-64 object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  
                  {/* Product Info */}
                  <h3 className="font-medium text-lg mb-1">{product.name}</h3>
                  <p className="text-gray-700 text-sm mb-2">{product.description}</p>
                  
                  {/* Price */}
                  <div className="flex items-center mb-3">
                    <span className="font-medium">${product.price}</span>
                    {product.originalPrice && (
                      <span className="text-gray-500 line-through ml-2">(${product.originalPrice} Value)</span>
                    )}
                  </div>
                  
                  {/* Color options */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.colors.map(color => (
                      <ColorOption 
                        key={color} 
                        color={color} 
                        isSelected={selectedColors[product.id] === color}
                        onClick={() => handleColorSelect(product.id, color)}
                      />
                    ))}
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="text-xs border border-gray-300 rounded-md px-2 py-1 text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component cho mục danh mục trong sidebar
const CategoryItem: React.FC<CategoryProps> = ({ title, isActive = false, isHeading = false, indent = false, onClick }) => {
  return (
    <button 
      className={`block text-left w-full py-1 ${
        isHeading ? 'font-medium' : ''
      } ${
        isActive ? 'font-medium text-gray-900' : 'text-gray-600 hover:text-gray-900'
      } ${
        indent ? 'pl-4' : ''
      }`}
      onClick={onClick}
    >
      {title}
    </button>
  );
};

// Component cho tùy chọn màu sắc
const ColorOption: React.FC<ColorOptionProps> = ({ color, isSelected = false, onClick }) => {
  return (
    <button 
      className={`w-6 h-6 rounded-full ${
        isSelected ? 'ring-2 ring-offset-2 ring-gray-400' : ''
      }`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      aria-label={`Color option: ${color}`}
    />
  );
};

export default BakewareCategoryPage;