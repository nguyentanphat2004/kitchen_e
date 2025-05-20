import React, { useState } from 'react';
import { 
  Zap, Search, Filter, Calendar, ArrowUpDown, Eye, Edit, 
  Trash2, ChevronLeft, ChevronRight, PlusCircle, Download,
  Clock, DollarSign, Tag, CheckCircle, XCircle, AlertTriangle,
  Percent
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FlashSale {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled';
  itemCount: number;
  priority: number;
  createdAt: string;
}

// Mock data
const generateMockFlashSales = (): FlashSale[] => {
  const statuses: FlashSale['status'][] = ['draft', 'scheduled', 'active', 'ended', 'cancelled'];
  
  return Array(25).fill(null).map((_, index) => {
    // Past date for created
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60));
    
    // Future date for start (or past for some)
    const startDate = new Date();
    if (Math.random() > 0.7) {
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 15));
    } else {
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 15));
    }
    
    // End date after start date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 10) + 1);
    
    const discountType = Math.random() > 0.5 ? 'percentage' : 'fixed';
    const discountValue = discountType === 'percentage' 
      ? Math.floor(Math.random() * 70) + 10 
      : Math.floor(Math.random() * 500000) + 50000;
    
    let status: FlashSale['status'];
    const now = new Date();
    if (endDate < now) {
      status = 'ended';
    } else if (startDate > now) {
      status = Math.random() > 0.3 ? 'scheduled' : 'draft';
    } else {
      status = 'active';
    }
    
    // Randomly make some cancelled
    if (Math.random() < 0.1) {
      status = 'cancelled';
    }
    
    return {
      id: `flash-${1000 + index}`,
      name: [
        'Flash Sale Cuối Tuần', 'Khuyến Mãi Hè', 'Giảm Giá Đặc Biệt', 
        'Sale Tháng 5', 'Ưu Đãi Đặc Biệt', 'Flash Sale Nồi & Chảo',
        'Khuyến Mãi Dao Nhà Bếp', 'Sale Đồ Điện Tử', 'Giảm Sốc Cuối Tháng',
        'Flash Sale Sinh Nhật'
      ][Math.floor(Math.random() * 10)],
      description: 'Chương trình giảm giá có thời hạn với nhiều ưu đãi hấp dẫn.',
      startDate: startDate.toLocaleDateString('vi-VN'),
      endDate: endDate.toLocaleDateString('vi-VN'),
      discountType,
      discountValue,
      status,
      itemCount: Math.floor(Math.random() * 30) + 1,
      priority: Math.floor(Math.random() * 100),
      createdAt: createdDate.toLocaleDateString('vi-VN'),
    };
  });
};

const mockFlashSales = generateMockFlashSales();

// Status Badge Component
interface StatusBadgeProps {
  status: FlashSale['status'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  let icon = null;
  
  switch (status) {
    case 'draft':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      icon = <Edit size={14} className="mr-1" />;
      break;
    case 'scheduled':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      icon = <Clock size={14} className="mr-1" />;
      break;
    case 'active':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      icon = <CheckCircle size={14} className="mr-1" />;
      break;
    case 'ended':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      icon = <AlertTriangle size={14} className="mr-1" />;
      break;
    case 'cancelled':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      icon = <XCircle size={14} className="mr-1" />;
      break;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status === 'draft' && 'Bản nháp'}
      {status === 'scheduled' && 'Đã lên lịch'}
      {status === 'active' && 'Đang hoạt động'}
      {status === 'ended' && 'Đã kết thúc'}
      {status === 'cancelled' && 'Đã hủy'}
    </span>
  );
};

const FlashSaleList: React.FC = () => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>(mockFlashSales);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof FlashSale>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FlashSale['status'] | ''>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedFlashSales, setSelectedFlashSales] = useState<string[]>([]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Sorting
  const sortedFlashSales = [...flashSales].sort((a: any, b: any) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Filtering
  const filteredFlashSales = sortedFlashSales.filter(flashSale => {
    const matchesSearch = 
      flashSale.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flashSale.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus ? flashSale.status === filterStatus : true;
    
    // Date range filtering for start date
    let matchesDateRange = true;
    if (dateRange.start || dateRange.end) {
      const saleStartDate = new Date(flashSale.startDate.split('/').reverse().join('-'));
      
      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        if (saleStartDate < startDate) matchesDateRange = false;
      }
      
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        if (saleStartDate > endDate) matchesDateRange = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const currentFlashSales = filteredFlashSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFlashSales.length / itemsPerPage);

  // Handlers
  const handleSort = (field: keyof FlashSale) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedFlashSales(currentFlashSales.map(sale => sale.id));
    } else {
      setSelectedFlashSales([]);
    }
  };

  const handleSelectFlashSale = (id: string) => {
    if (selectedFlashSales.includes(id)) {
      setSelectedFlashSales(selectedFlashSales.filter(saleId => saleId !== id));
    } else {
      setSelectedFlashSales([...selectedFlashSales, id]);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setDateRange({ start: '', end: '' });
  };

  const handleDeleteFlashSale = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chương trình Flash Sale này?')) {
      setFlashSales(flashSales.filter(sale => sale.id !== id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedFlashSales.length} chương trình Flash Sale đã chọn?`)) {
      setFlashSales(flashSales.filter(sale => !selectedFlashSales.includes(sale.id)));
      setSelectedFlashSales([]);
    }
  };

  const handleToggleStatus = (id: string, newStatus: FlashSale['status']) => {
    setFlashSales(flashSales.map(sale => 
      sale.id === id ? { ...sale, status: newStatus } : sale
    ));
  };

  // Format discount display
  const formatDiscount = (sale: FlashSale) => {
    if (sale.discountType === 'percentage') {
      return `${sale.discountValue}%`;
    } else {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
      }).format(sale.discountValue);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Zap className="mr-2" size={24} />
          Quản lý Flash Sale
        </h1>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Download size={16} className="mr-1" />
            Xuất Excel
          </button>
          <Link 
            to="/flashe/add" 
            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle size={16} className="mr-1" />
            Tạo Flash Sale mới
          </Link>
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
              placeholder="Tìm kiếm Flash Sale..."
              className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[180px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FlashSale['status'] | '')}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="draft">Bản nháp</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="active">Đang hoạt động</option>
                <option value="ended">Đã kết thúc</option>
                <option value="cancelled">Đã hủy</option>
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
      {selectedFlashSales.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-md flex items-center justify-between">
          <span className="text-indigo-700 font-medium">
            {selectedFlashSales.length} Flash Sale được chọn
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      )}

      {/* Flash Sale Table */}
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
                    checked={selectedFlashSales.length > 0 && selectedFlashSales.length === currentFlashSales.length}
                  />
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Tên chương trình
                  {sortField === 'name' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('startDate')}
                >
                  Thời gian
                  {sortField === 'startDate' && (
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
                Sản phẩm
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('priority')}
                >
                  Ưu tiên
                  {sortField === 'priority' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  Trạng thái
                  {sortField === 'status' && (
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
            {currentFlashSales.map((flashSale) => (
              <tr key={flashSale.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={selectedFlashSales.includes(flashSale.id)}
                      onChange={() => handleSelectFlashSale(flashSale.id)}
                    />
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {flashSale.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {flashSale.id}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    {flashSale.startDate} - {flashSale.endDate}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Tạo: {flashSale.createdAt}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    {flashSale.discountType === 'percentage' ? (
                      <Percent className="h-4 w-4 mr-1 text-green-500" />
                    ) : (
                      <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                    )}
                    <span className="font-medium text-green-600">
                      {formatDiscount(flashSale)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    <Tag className="h-4 w-4 mr-1 text-gray-400" />
                    {flashSale.itemCount} sản phẩm
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{flashSale.priority}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <StatusBadge status={flashSale.status} />
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex justify-center gap-2">
                    <Link 
                      to={`/flashe/${flashSale.id}`} 
                      className="text-indigo-600 hover:text-indigo-900" 
                      title="Xem chi tiết"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                    {(flashSale.status === 'draft' || flashSale.status === 'scheduled') && (
                      <Link 
                        to={`/flashe/${flashSale.id}/edit`} 
                        className="text-blue-600 hover:text-blue-900" 
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                    )}
                    {flashSale.status === 'draft' && (
                      <button 
                        onClick={() => handleToggleStatus(flashSale.id, 'scheduled')}
                        className="text-green-600 hover:text-green-900" 
                        title="Lên lịch"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                    {(flashSale.status === 'scheduled' || flashSale.status === 'active') && (
                      <button 
                        onClick={() => handleToggleStatus(flashSale.id, 'cancelled')}
                        className="text-red-600 hover:text-red-900" 
                        title="Hủy"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteFlashSale(flashSale.id)}
                      className="text-red-600 hover:text-red-900" 
                      title="Xóa"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {currentFlashSales.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-sm text-gray-500">
                  Không tìm thấy Flash Sale nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, filteredFlashSales.length)}</span> của <span className="font-medium">{filteredFlashSales.length}</span> Flash Sale
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

export default FlashSaleList;