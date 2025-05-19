import React, { useState } from 'react';
import { 
  Tag, Search, Calendar, ArrowUpDown, PlusCircle, Edit, 
  Trash2, Eye, Copy, ChevronLeft, ChevronRight, Filter, 
  Download, Percent, DollarSign, ToggleLeft
} from 'lucide-react';

interface Voucher {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxUsage: number;
  currentUsage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isPrivate: boolean;
  categories: string[];
}

// Mock data
const generateMockVouchers = (): Voucher[] => {
  return Array(30).fill(null).map((_, index) => {
    const discountType = Math.random() > 0.5 ? 'percentage' : 'fixed';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 60) + 30);
    
    const maxUsage = Math.floor(Math.random() * 100) + 50;
    const currentUsage = Math.floor(Math.random() * maxUsage);
    const isActive = Math.random() > 0.3;
    
    return {
      id: `voucher-${1000 + index}`,
      code: `SALE${['SUMMER', 'WINTER', 'SPRING', 'FLASH', 'NEW', 'SPECIAL'][Math.floor(Math.random() * 6)]}${Math.floor(Math.random() * 1000)}`,
      description: [
        'Giảm giá mùa hè', 'Khuyến mãi đặc biệt', 'Ưu đãi cho khách hàng mới', 
        'Giảm giá Black Friday', 'Khuyến mãi cuối tuần', 'Ưu đãi sinh nhật'
      ][Math.floor(Math.random() * 6)],
      discountType,
      discountValue: discountType === 'percentage' 
        ? Math.floor(Math.random() * 50) + 5 
        : Math.floor(Math.random() * 200000) + 50000,
      minOrderValue: Math.floor(Math.random() * 500000) + 100000,
      maxUsage,
      currentUsage,
      startDate: startDate.toLocaleDateString('vi-VN'),
      endDate: endDate.toLocaleDateString('vi-VN'),
      isActive,
      isPrivate: Math.random() > 0.7,
      categories: [
        ['Dao/kéo', 'Nồi/chảo', 'Đồ điện tử', 'Phụ kiện nhà bếp', 'Bếp/lò'][Math.floor(Math.random() * 5)]
      ]
    };
  });
};

const mockVouchers = generateMockVouchers();

const VoucherManagement: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Voucher>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<'' | 'percentage' | 'fixed'>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]);
  const [showAddVoucherModal, setShowAddVoucherModal] = useState(false);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Sorting
  const sortedVouchers = [...vouchers].sort((a: any, b: any) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Filtering
  const filteredVouchers = sortedVouchers.filter(voucher => {
    const matchesSearch = 
      voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? voucher.isActive :
      filterStatus === 'inactive' ? !voucher.isActive :
      filterStatus === 'expired' ? new Date(voucher.endDate.split('/').reverse().join('-')) < new Date() :
      true;
    
    const matchesType = filterType ? voucher.discountType === filterType : true;
    
    // Date range filtering for start date
    let matchesDateRange = true;
    if (dateRange.start || dateRange.end) {
      const voucherStartDate = new Date(voucher.startDate.split('/').reverse().join('-'));
      
      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        if (voucherStartDate < startDate) matchesDateRange = false;
      }
      
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        if (voucherStartDate > endDate) matchesDateRange = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDateRange;
  });

  const currentVouchers = filteredVouchers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

  // Handlers
  const handleSort = (field: keyof Voucher) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedVouchers(currentVouchers.map(voucher => voucher.id));
    } else {
      setSelectedVouchers([]);
    }
  };

  const handleSelectVoucher = (id: string) => {
    if (selectedVouchers.includes(id)) {
      setSelectedVouchers(selectedVouchers.filter(voucherId => voucherId !== id));
    } else {
      setSelectedVouchers([...selectedVouchers, id]);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterType('');
    setDateRange({ start: '', end: '' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép mã: ${text}`);
  };

  const handleToggleStatus = (id: string) => {
    setVouchers(vouchers.map(voucher => 
      voucher.id === id ? { ...voucher, isActive: !voucher.isActive } : voucher
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Tag className="mr-2" size={24} />
          Quản lý mã giảm giá
        </h1>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Download size={16} className="mr-1" />
            Xuất Excel
          </button>
          <button 
            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowAddVoucherModal(true)}
          >
            <PlusCircle size={16} className="mr-1" />
            Thêm mã giảm giá
          </button>
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
              placeholder="Tìm kiếm theo mã, mô tả..."
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
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã tắt</option>
                <option value="expired">Đã hết hạn</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[150px]"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as '' | 'percentage' | 'fixed')}
              >
                <option value="">Tất cả loại</option>
                <option value="percentage">Giảm theo %</option>
                <option value="fixed">Giảm số tiền cố định</option>
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
      {selectedVouchers.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-md flex items-center justify-between">
          <span className="text-indigo-700 font-medium">
            {selectedVouchers.length} mã giảm giá được chọn
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50">
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

      {/* Vouchers Table */}
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
                    checked={selectedVouchers.length > 0 && selectedVouchers.length === currentVouchers.length}
                  />
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('code')}
                >
                  Mã giảm giá
                  {sortField === 'code' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('description')}
                >
                  Mô tả
                  {sortField === 'description' && (
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
                  onClick={() => handleSort('minOrderValue')}
                >
                  Đơn tối thiểu
                  {sortField === 'minOrderValue' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('currentUsage')}
                >
                  Sử dụng
                  {sortField === 'currentUsage' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('endDate')}
                >
                  Thời hạn
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
            {currentVouchers.map((voucher) => {
              const isExpired = new Date(voucher.endDate.split('/').reverse().join('-')) < new Date();
              
              return (
                <tr key={voucher.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        checked={selectedVouchers.includes(voucher.id)}
                        onChange={() => handleSelectVoucher(voucher.id)}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <span className="font-medium text-indigo-600">{voucher.code}</span>
                        <button 
                          className="ml-2 text-gray-400 hover:text-gray-600" 
                          onClick={() => copyToClipboard(voucher.code)}
                          title="Sao chép mã"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      {voucher.isPrivate && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Riêng tư
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{voucher.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {voucher.categories.map((category, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-1">
                          {category}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {voucher.discountType === 'percentage' ? (
                        <span className="flex items-center">
                          <Percent className="h-4 w-4 mr-1 text-green-500" />
                          {voucher.discountValue}%
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                          {voucher.discountValue.toLocaleString()} VNĐ
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{voucher.minOrderValue.toLocaleString()} VNĐ</div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <span className="font-medium">{voucher.currentUsage}</span>
                      <span className="mx-1">/</span>
                      <span>{voucher.maxUsage || '∞'}</span>
                    </div>
                    {voucher.maxUsage > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, (voucher.currentUsage / voucher.maxUsage) * 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {voucher.startDate} - {voucher.endDate}
                    </div>
                    {isExpired && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                        Hết hạn
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(voucher.id)}
                      disabled={isExpired}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        voucher.isActive && !isExpired ? 'bg-indigo-600' : 'bg-gray-200'
                      } ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="sr-only">Toggle status</span>
                      <span
                        className={`pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          voucher.isActive && !isExpired ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      >
                        <span
                          className={`absolute inset-0 h-full w-full flex items-center justify-center transition-opacity ${
                            voucher.isActive && !isExpired ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200'
                          }`}
                        >
                          <ToggleLeft className="h-3 w-3 text-gray-400" />
                        </span>
                        <span
                          className={`absolute inset-0 h-full w-full flex items-center justify-center transition-opacity ${
                            voucher.isActive && !isExpired ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100'
                          }`}
                        >
                          <ToggleLeft className="h-3 w-3 text-indigo-600 transform rotate-180" />
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center gap-2">
                      <button className="text-indigo-600 hover:text-indigo-900" title="Xem chi tiết">
                        <Eye className="h-5 w-5" />
                      </button>
                      <button 
                        className="text-blue-600 hover:text-blue-900" 
                        title="Sửa"
                        disabled={isExpired}
                      >
                        <Edit className={`h-5 w-5 ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`} />
                      </button>
                      <button className="text-red-600 hover:text-red-900" title="Xóa">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, filteredVouchers.length)}</span> của <span className="font-medium">{filteredVouchers.length}</span> mã giảm giá
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

      {/* Add Voucher Modal (simplified for the example) */}
      {showAddVoucherModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Thêm mã giảm giá mới</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="voucherCode" className="block text-sm font-medium text-gray-700">
                          Mã giảm giá
                        </label>
                        <input
                          type="text"
                          name="voucherCode"
                          id="voucherCode"
                          placeholder="VD: SUMMER2024"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      
                      {/* Thêm các trường khác ở đây */}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddVoucherModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;
