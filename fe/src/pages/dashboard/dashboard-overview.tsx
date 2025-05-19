import React from 'react';
import { 
  ShoppingCart, Users, Package, DollarSign, TrendingUp, 
  TrendingDown, CreditCard, Package as PackageIcon, Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Demo data for charts
const revenueData = [
  { name: 'T1', revenue: 12000000 },
  { name: 'T2', revenue: 15000000 },
  { name: 'T3', revenue: 18000000 },
  { name: 'T4', revenue: 16000000 },
  { name: 'T5', revenue: 21000000 },
  { name: 'T6', revenue: 19000000 },
  { name: 'T7', revenue: 22000000 },
];

const recentOrders = [
  { id: 'DH-20250519-ABC123', customer: 'Nguyễn Văn A', date: '19/05/2025', total: '1,250,000 VNĐ', status: 'Đang xử lý' },
  { id: 'DH-20250518-DEF456', customer: 'Trần Thị B', date: '18/05/2025', total: '850,000 VNĐ', status: 'Đã giao hàng' },
  { id: 'DH-20250518-GHI789', customer: 'Phạm Văn C', date: '18/05/2025', total: '2,150,000 VNĐ', status: 'Đang giao hàng' },
  { id: 'DH-20250517-JKL012', customer: 'Lê Thị D', date: '17/05/2025', total: '3,450,000 VNĐ', status: 'Hoàn thành' },
  { id: 'DH-20250517-MNO345', customer: 'Hoàng Văn E', date: '17/05/2025', total: '780,000 VNĐ', status: 'Đang xử lý' },
];

const bestSellingProducts = [
  { name: 'Dao nhà bếp đa năng', sales: 58, image: '/products/knife.jpg', revenue: '8,700,000 VNĐ' },
  { name: 'Bộ nồi inox 5 món', sales: 42, image: '/products/pots.jpg', revenue: '12,600,000 VNĐ' },
  { name: 'Chảo chống dính cao cấp', sales: 35, image: '/products/pan.jpg', revenue: '7,000,000 VNĐ' },
  { name: 'Máy xay sinh tố công suất lớn', sales: 29, image: '/products/blender.jpg', revenue: '8,700,000 VNĐ' },
];

// Stats cards component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: {
    value: string;
    isPositive: boolean;
  };
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, bgColor }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{value}</h2>
      </div>
      <div className={`${bgColor} p-3 rounded-full`}>
        {icon}
      </div>
    </div>
    <div className="flex items-center mt-2">
      {change.isPositive ? (
        <TrendingUp size={18} className="text-green-500 mr-1" />
      ) : (
        <TrendingDown size={18} className="text-red-500 mr-1" />
      )}
      <span className={`text-sm ${change.isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {change.value} so với tháng trước
      </span>
    </div>
  </div>
);

// Status badge component
interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let colorClass = '';
  
  switch (status) {
    case 'Đang xử lý':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'Đang giao hàng':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'Hoàn thành':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'Đã giao hàng':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'Đã hủy':
      colorClass = 'bg-red-100 text-red-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>{status}</span>;
};

// Main Dashboard component
const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Bảng điều khiển</h1>
        <div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Tạo báo cáo
          </button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Doanh thu tháng"
          value="485,250,000 VNĐ"
          icon={<DollarSign size={24} className="text-indigo-600" />}
          change={{ value: "+15.3%", isPositive: true }}
          bgColor="bg-indigo-100"
        />
        <StatCard
          title="Đơn hàng mới"
          value="152"
          icon={<ShoppingCart size={24} className="text-blue-600" />}
          change={{ value: "+7.2%", isPositive: true }}
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Khách hàng mới"
          value="89"
          icon={<Users size={24} className="text-green-600" />}
          change={{ value: "+12.5%", isPositive: true }}
          bgColor="bg-green-100"
        />
        <StatCard
          title="Lượt xem sản phẩm"
          value="28,350"
          icon={<Eye size={24} className="text-purple-600" />}
          change={{ value: "-3.4%", isPositive: false }}
          bgColor="bg-purple-100"
        />
      </div>
      
      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Doanh thu theo tháng</h2>
          <select className="border border-gray-300 rounded-md p-2 text-sm">
            <option>7 ngày qua</option>
            <option>30 ngày qua</option>
            <option selected>6 tháng qua</option>
            <option>12 tháng qua</option>
          </select>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(value) => `${value / 1000000}M`} 
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()} VNĐ`, 'Doanh thu']}
                labelFormatter={(label) => `Tháng ${label}`}
              />
              <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Đơn hàng gần đây</h2>
            <a href="/orders" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              Xem tất cả
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-3 border-b">Mã đơn</th>
                  <th className="px-3 py-3 border-b">Khách hàng</th>
                  <th className="px-3 py-3 border-b">Ngày</th>
                  <th className="px-3 py-3 border-b">Tổng tiền</th>
                  <th className="px-3 py-3 border-b">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="font-medium text-indigo-600">{order.id}</span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">{order.customer}</td>
                    <td className="px-3 py-4 whitespace-nowrap">{order.date}</td>
                    <td className="px-3 py-4 whitespace-nowrap">{order.total}</td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Best Selling Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Sản phẩm bán chạy</h2>
            <a href="/products" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              Xem tất cả
            </a>
          </div>
          <div className="space-y-4">
            {bestSellingProducts.map((product, index) => (
              <div key={index} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <PackageIcon size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-800">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.revenue}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-800">{product.sales} đơn</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Truy cập nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/products/add" className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <Package size={24} className="text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Thêm sản phẩm</span>
          </a>
          <a href="/orders/processing" className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <ShoppingCart size={24} className="text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Xử lý đơn hàng</span>
          </a>
          <a href="/marketing/vouchers/add" className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <CreditCard size={24} className="text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Tạo mã giảm giá</span>
          </a>
          <a href="/reports/sales" className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <TrendingUp size={24} className="text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Báo cáo doanh thu</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
