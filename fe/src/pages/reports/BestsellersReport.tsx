import React, { useState } from 'react';
import { 
  BarChart2, Package, Calendar, Search, Filter, Download, Printer,
  ChevronDown, TrendingUp, TrendingDown, ArrowRight, ShoppingBag
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// Demo data
const bestsellersData = [
  { id: 1, name: 'Dao nhà bếp đa năng', category: 'Dao/kéo', sales: 142, revenue: 28400000, stock: 58 },
  { id: 2, name: 'Bộ nồi inox 5 món', category: 'Nồi/chảo', sales: 118, revenue: 35400000, stock: 32 },
  { id: 3, name: 'Chảo chống dính cao cấp', category: 'Nồi/chảo', sales: 97, revenue: 19400000, stock: 15 },
  { id: 4, name: 'Máy xay sinh tố công suất lớn', category: 'Đồ điện tử', sales: 85, revenue: 25500000, stock: 29 },
  { id: 5, name: 'Bếp gas âm', category: 'Bếp/lò', sales: 74, revenue: 44400000, stock: 12 },
  { id: 6, name: 'Lò nướng điện', category: 'Đồ điện tử', sales: 68, revenue: 27200000, stock: 24 },
  { id: 7, name: 'Máy đánh trứng cầm tay', category: 'Đồ điện tử', sales: 62, revenue: 9300000, stock: 42 },
  { id: 8, name: 'Thớt gỗ tự nhiên', category: 'Phụ kiện nhà bếp', sales: 57, revenue: 5700000, stock: 76 },
  { id: 9, name: 'Rổ đựng rau quả', category: 'Phụ kiện nhà bếp', sales: 51, revenue: 4080000, stock: 95 },
  { id: 10, name: 'Máy ép trái cây', category: 'Đồ điện tử', sales: 43, revenue: 17200000, stock: 35 },
  { id: 11, name: 'Bộ dao làm bánh', category: 'Dao/kéo', sales: 39, revenue: 15600000, stock: 22 },
  { id: 12, name: 'Chảo wok cao cấp', category: 'Nồi/chảo', sales: 37, revenue: 11100000, stock: 18 },
  { id: 13, name: 'Nồi áp suất đa năng', category: 'Nồi/chảo', sales: 34, revenue: 17000000, stock: 14 },
  { id: 14, name: 'Máy nướng bánh mì', category: 'Đồ điện tử', sales: 32, revenue: 11200000, stock: 27 },
  { id: 15, name: 'Bình giữ nhiệt', category: 'Phụ kiện nhà bếp', sales: 29, revenue: 4350000, stock: 52 },
];

const categoryColors = {
  'Dao/kéo': '#4F46E5',
  'Nồi/chảo': '#3B82F6',
  'Đồ điện tử': '#06B6D4',
  'Phụ kiện nhà bếp': '#8B5CF6',
  'Bếp/lò': '#EC4899',
};

const categorySalesData = [
  { name: 'Dao/kéo', value: 181 },
  { name: 'Nồi/chảo', value: 249 },
  { name: 'Đồ điện tử', value: 290 },
  { name: 'Phụ kiện nhà bếp', value: 137 },
  { name: 'Bếp/lò', value: 74 },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const BestsellersReport: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | '12months' | 'custom'>('30days');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'sales' | 'revenue'>('sales');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Filtering
  const filteredProducts = bestsellersData.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? product.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortField === 'sales') {
      return b.sales - a.sales;
    } else {
      return b.revenue - a.revenue;
    }
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(bestsellersData.map(product => product.category)));

  // Top 5 products for chart
  const top5Products = sortedProducts.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <BarChart2 className="mr-2" size={24} />
          Báo cáo sản phẩm bán chạy
        </h1>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Download size={16} className="mr-1" />
            Xuất Excel
          </button>
          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Printer size={16} className="mr-1" />
            In báo cáo
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white shadow-sm rounded-lg p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDateRange('7days')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                dateRange === '7days'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setDateRange('30days')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                dateRange === '30days'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 ngày qua
            </button>
            <button
              onClick={() => setDateRange('90days')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                dateRange === '90days'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              90 ngày qua
            </button>
            <button
              onClick={() => setDateRange('12months')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                dateRange === '12months'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              12 tháng qua
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                dateRange === 'custom'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tùy chỉnh
            </button>
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  className="pl-10 py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                />
              </div>
              <span className="text-gray-500">đến</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  className="pl-10 py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                />
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Áp dụng
              </button>
            </div>
          )}
          
          {/* View modes */}
          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bảng
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                viewMode === 'chart'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Biểu đồ
            </button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên sản phẩm, danh mục..."
              className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as 'sales' | 'revenue')}
              >
                <option value="sales">Sắp xếp theo số lượng bán</option>
                <option value="revenue">Sắp xếp theo doanh thu</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Tổng sản phẩm đã bán</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">931</h3>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <ShoppingBag className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-500">12.5% so với kỳ trước</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Tổng doanh thu</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(251430000)}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <BarChart2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-500">8.3% so với kỳ trước</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Giá trị trung bình mỗi đơn</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(270064)}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-sm text-red-500">2.1% so với kỳ trước</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'table' ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thứ hạng
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng bán
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doanh thu
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tồn kho hiện tại
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${index < 3 ? 'text-indigo-600' : 'text-gray-900'}`}>
                        #{index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center" style={{backgroundColor: `${categoryColors[product.category as keyof typeof categoryColors]}20`}}>
                            <Package className="h-6 w-6" style={{color: categoryColors[product.category as keyof typeof categoryColors]}} />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">ID: {product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" style={{backgroundColor: `${categoryColors[product.category as keyof typeof categoryColors]}20`, color: categoryColors[product.category as keyof typeof categoryColors]}}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {product.sales} sản phẩm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.stock > 20 ? 'bg-green-100 text-green-800' : 
                        product.stock > 10 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock} sản phẩm
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Top 5 sản phẩm theo {sortField === 'sales' ? 'số lượng bán' : 'doanh thu'}</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={top5Products}
                  layout="vertical"
                  margin={{
                    top: 5, right: 30, left: 100, bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'sales') return [`${value} sản phẩm`, 'Số lượng bán'];
                      if (name === 'revenue') return [formatCurrency(value as number), 'Doanh thu'];
                      return [value, name];
                    }}
                  />
                  <Bar 
                    dataKey={sortField} 
                    name={sortField === 'sales' ? 'Số lượng bán' : 'Doanh thu'} 
                    radius={[0, 4, 4, 0]}
                  >
                    {top5Products.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[entry.category as keyof typeof categoryColors]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Phân bố sản phẩm theo danh mục</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categorySalesData}
                  margin={{
                    top: 20, right: 30, left: 20, bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} sản phẩm`, 'Số lượng bán']} />
                  <Bar dataKey="value" name="Số lượng bán" radius={[4, 4, 0, 0]}>
                    {categorySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[entry.name as keyof typeof categoryColors]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BestsellersReport;