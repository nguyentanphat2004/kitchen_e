import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  Home, Package, Users, ShoppingCart, Tag, Calendar, Settings, 
  BarChart2, FileText, Book, Gift, LogOut, Menu, X, ChevronDown, ChevronRight 
} from 'lucide-react';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  submenu?: {
    title: string;
    path: string;
  }[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Trang chủ',
    icon: <Home size={20} />,
    path: '/dashboard'
  },
  {
    title: 'Sản phẩm',
    icon: <Package size={20} />,
    path: '/products',
    submenu: [
      { title: 'Tất cả sản phẩm', path: '/products' },
      { title: 'Thêm sản phẩm', path: '/products/add' },
      { title: 'Danh mục', path: '/products/categories' },
      { title: 'Tùy chỉnh sản phẩm', path: '/products/customizations' },
    ]
  },
  {
    title: 'Đơn hàng',
    icon: <ShoppingCart size={20} />,
    path: '/orders',
    submenu: [
      { title: 'Tất cả đơn hàng', path: '/orders' },
      { title: 'Đang xử lý', path: '/orders/processing' },
      { title: 'Đang giao hàng', path: '/orders/shipping' },
      { title: 'Hoàn thành', path: '/orders/completed' },
      { title: 'Đã hủy', path: '/orders/cancelled' },
    ]
  },
  {
    title: 'Khách hàng',
    icon: <Users size={20} />,
    path: '/customers'
  },
  {
    title: 'Marketing',
    icon: <Tag size={20} />,
    path: '/marketing',
    submenu: [
      { title: 'Mã giảm giá', path: '/marketing/vouchers' },
      { title: 'Flash Sales', path: '/marketing/flash-sales' },
      { title: 'Gói combo', path: '/marketing/bundles' },
    ]
  },
  {
    title: 'Công thức nấu ăn',
    icon: <Book size={20} />,
    path: '/recipes',
    submenu: [
      { title: 'Tất cả công thức', path: '/recipes' },
      { title: 'Thêm công thức', path: '/recipes/add' },
    ]
  },
  {
    title: 'Đánh giá',
    icon: <FileText size={20} />,
    path: '/reviews'
  },
  {
    title: 'Báo cáo',
    icon: <BarChart2 size={20} />,
    path: '/reports',
    submenu: [
      { title: 'Doanh thu', path: '/reports/sales' },
      { title: 'Sản phẩm bán chạy', path: '/reports/bestsellers' },
      { title: 'Phân tích khách hàng', path: '/reports/customers' },
    ]
  },
  {
    title: 'Trợ lý AI',
    icon: <Gift size={20} />,
    path: '/ai-assistant',
  },
  {
    title: 'Cài đặt',
    icon: <Settings size={20} />,
    path: '/settings'
  },
];

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const location = useLocation();
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const toggleSubmenu = (title: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };
  
  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white duration-300 border-r border-gray-200 shadow-sm relative`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {isSidebarOpen ? (
            <div className="flex items-center">
              <img src="/logo.png" alt="Logo" className="h-8 w-8" />
              <span className="ml-2 font-bold text-xl text-gray-800">Admin</span>
            </div>
          ) : (
            <img src="/logo-small.png" alt="Logo" className="h-8 w-8 mx-auto" />
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        {/* Navigation Menu */}
        <nav className="mt-4 px-2 overflow-y-auto h-[calc(100vh-12rem)]">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.title}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className={`flex items-center justify-between w-full p-2 rounded-md transition-colors ${
                        isActiveRoute(item.path)
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-lg">{item.icon}</span>
                        {isSidebarOpen && <span className="ml-3">{item.title}</span>}
                      </div>
                      {isSidebarOpen && (
                        openSubmenus[item.title] ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                      )}
                    </button>
                    
                    {isSidebarOpen && openSubmenus[item.title] && (
                      <ul className="pl-10 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.title}>
                            <Link
                              to={subItem.path}
                              className={`block p-2 rounded-md transition-colors ${
                                isActiveRoute(subItem.path)
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'hover:bg-gray-100 text-gray-600'
                              }`}
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center p-2 rounded-md transition-colors ${
                      isActiveRoute(item.path)
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {isSidebarOpen && <span className="ml-3">{item.title}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200">
          <div className="px-4 py-4">
            <button
              className={`flex items-center w-full p-2 rounded-md hover:bg-red-50 text-red-500 transition-colors ${
                !isSidebarOpen && 'justify-center'
              }`}
            >
              <LogOut size={20} />
              {isSidebarOpen && <span className="ml-3">Đăng xuất</span>}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Quản trị hệ thống</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <div className="flex items-center">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="User avatar"
                className="h-8 w-8 rounded-full"
              />
              <span className="ml-2 font-medium">Admin</span>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
