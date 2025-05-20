import React, { useState } from 'react';
import { 
  Package, Search, PlusCircle, Edit, Trash2, Eye, 
  ArrowUpDown, ChevronLeft, ChevronRight, Filter,
  Download, Calendar, Tag, DollarSign
} from 'lucide-react';

interface Bundle {
  id: string;
  name: string;
  description: string;
  image?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  totalItems: number;
  slug: string;
}

// Mock data
const mockBundles: Bundle[] = Array(20).fill(null).map((_, index) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 90) + 30);
  
  return {
    id: `bundle-${1000 + index}`,
    name: [
      'Bộ dụng cụ nhà bếp cơ bản', 'Combo nấu ăn gia đình', 'Trọn bộ nhà bếp hiện đại',
      'Combo dành cho người mới bắt đầu', 'Bộ sản phẩm nấu ăn chuyên nghiệp', 'Combo làm bánh',
      'Trọn bộ nấu ăn châu Á', 'Combo nhà bếp tiết kiệm'
    ][index % 8],
    description: `Mô tả cho combo ${index + 1} với nhiều thông tin chi tiết về các sản phẩm thuộc combo này.`,
    image: index % 3 === 0 ? `/bundle-${index}.jpg` : undefined,
    startDate: startDate.toLocaleDateString('vi-VN'),
    endDate: endDate.toLocaleDateString('vi-VN'),
    isActive: startDate <= new Date() && endDate >= new Date(),
    discountType: index % 2 === 0 ? 'percentage' : 'fixed',
    discountValue: index % 2 === 0 ? Math.floor(Math.random() * 30) + 5 : Math.floor(Math.random() * 500000) + 50000,
    totalItems: Math.floor(Math.random() * 10) + 2,
    slug: [
      'bo-dung-cu-nha-bep-co-ban', 'combo-nau-an-gia-dinh', 'tron-bo-nha-bep-hien-dai',
      'combo-cho-nguoi-moi-bat-dau', 'bo-san-pham-nau-an-chuyen-nghiep', 'combo-lam-banh',
      'tron-bo-nau-an-chau-a', 'combo-nha-bep-tiet-kiem'
    ][index % 8]
  };
});

const BundleManagement: React.FC = () => {
  const [bundles, setBundles] = useState<Bundle[]>(mockBundles);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Bundle>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedBundles, setSelectedBundles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Sorting
  const sortedBundles = [...bundles].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Filtering
  const filteredBundles = sortedBundles.filter(bundle => {
    const matchesSearch = 
      bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bundle.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? bundle.isActive :
      !bundle.isActive;
    
    // Date range filtering for start date
    let matchesDateRange = true;
    if (dateRange.start || dateRange.end) {
      const bundleStartDate = new Date(bundle.startDate.split('/').reverse().join('-'));
      
      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        if (bundleStartDate < startDate) matchesDateRange = false;
      }
      
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        if (bundleStartDate > endDate) matchesDateRange = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const currentBundles = filteredBundles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBundles.length / itemsPerPage);

  // Handlers
  const handleSort = (field: keyof Bundle) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBundles(currentBundles.map(bundle => bundle.id));
    } else {
      setSelectedBundles([]);
    }
  };

  const handleSelectBundle = (id: string) => {
    if (selectedBundles.includes(id)) {
      setSelectedBundles(selectedBundles.filter(bundleId => bundleId !== id));
    } else {
      setSelectedBundles([...selectedBundles, id]);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setDateRange({ start: '', end: '' });
  };

  const handleDeleteBundle = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa gói combo này?')) {
      setBundles(bundles.filter(bundle => bundle.id !== id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedBundles.length} gói combo đã chọn?`)) {
      setBundles(bundles.filter(bundle => !selectedBundles.includes(bundle.id)));
      setSelectedBundles([]);
    }
  };

  // Format discount value
  const formatDiscount = (bundle: Bundle) => {
    if (bundle.discountType === 'percentage') {
      return `${bundle.discountValue}%`;
    } else {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bundle.discountValue);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Package className="mr-2" size={24} />
          Quản lý combo sản phẩm
        </h1>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Download size={16} className="mr-1" />
            Xuất Excel
          </button>
          <a 
            href="/bundles/add" 
            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle size={16} className="mr-1" />
            Thêm combo mới
          </a>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow-sm rounded-lg p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mô tả..."
              className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[150px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                placeholder="Từ ngày"
                className="pl-10 py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <span className="text-gray-500">đến</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                placeholder="Đến ngày"
                className="pl-10 py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
            >
              Xóa bộ lọc
            </button>
            <select
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={10}>10 mục</option>
              <option value={25}>25 mục</option>
              <option value={50}>50 mục</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Items Actions */}
      {selectedBundles.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-md flex items-center justify-between">
          <span className="text-indigo-700 font-medium">
            {selectedBundles.length} combo sản phẩm được chọn
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button className="px-3 py-1 bg-white text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50">
              Kích hoạt
            </button>
            <button className="px-3 py-1 bg-white text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
              Vô hiệu hóa
            </button>
          </div>
        </div>
      )}

      {/* Bundles Table */}
      <div className="overflow-x-auto bg-white shadow-sm rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3 text-left">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    onChange={handleSelectAll}
                    checked={selectedBundles.length > 0 && selectedBundles.length === currentBundles.length}
                  />
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Tên combo
                  {sortField === 'name' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('totalItems')}
                >
                  Sản phẩm
                  {sortField === 'totalItems' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('discountValue')}
                >
                  Giảm giá
                  {sortField === 'discountValue' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('startDate')}
                >
                  Bắt đầu
                  {sortField === 'startDate' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('endDate')}
                >
                  Kết thúc
                  {sortField === 'endDate' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('isActive')}
                >
                  Trạng thái
                  {sortField === 'isActive' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentBundles.map((bundle) => (
              <tr key={bundle.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={selectedBundles.includes(bundle.id)}
                      onChange={() => handleSelectBundle(bundle.id)}
                    />
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 mr-3">
                      <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                        {bundle.image ? (
                          <img src={bundle.image} alt={bundle.name} className="h-10 w-10 rounded-md object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{bundle.name}</div>
                      <div className="text-xs text-gray-500">{bundle.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-900">{bundle.totalItems} sản phẩm</span>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium">
                    <span className="flex items-center">
                      {bundle.discountType === 'percentage' ? (
                        <span className="text-green-600">{bundle.discountValue}%</span>
                      ) : (
                        <span className="flex items-center text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {new Intl.NumberFormat('vi-VN').format(bundle.discountValue)} VNĐ
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{bundle.startDate}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{bundle.endDate}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    bundle.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {bundle.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex justify-center space-x-2">
                    <a 
                      href={`/bundles/${bundle.id}`}
                      className="text-indigo-600 hover:text-indigo-900" 
                      title="Xem chi tiết"
                    >
                      <Eye className="h-5 w-5" />
                    </a>
                    <a 
                      href={`/bundles/${bundle.id}/edit`}
                      className="text-blue-600 hover:text-blue-900" 
                      title="Sửa"
                    >
                      <Edit className="h-5 w-5" />
                    </a>
                    <button 
                      className="text-red-600 hover:text-red-900" 
                      title="Xóa"
                      onClick={() => handleDeleteBundle(bundle.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, filteredBundles.length)}</span> của <span className="font-medium">{filteredBundles.length}</span> combo sản phẩm
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BundleManagement;