import React, { useState } from 'react';
import { 
  Bell, Search, PlusCircle, Edit, Trash2, Eye, 
  ArrowUpDown, ChevronLeft, ChevronRight, Calendar,
  Users, Send, FileText
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'order' | 'promotion' | 'system' | 'account';
  sendTo: 'all' | 'specific';
  recipients?: number;
  isScheduled: boolean;
  scheduledFor?: string;
  createdAt: string;
  sentAt?: string;
  status: 'draft' | 'sent' | 'scheduled' | 'failed';
  readCount?: number;
  openRate?: number;
  clickRate?: number;
}

// Mock data
const generateMockNotifications = (): Notification[] => {
  const types: Notification['type'][] = ['general', 'order', 'promotion', 'system', 'account'];
  const statuses: Notification['status'][] = ['draft', 'sent', 'scheduled', 'failed'];
  
  return Array(30).fill(null).map((_, index) => {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
    
    const type = types[Math.floor(Math.random() * types.length)];
    const sendTo = Math.random() > 0.7 ? 'specific' : 'all';
    const isScheduled = Math.random() > 0.7;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    let scheduledFor;
    if (isScheduled) {
      scheduledFor = new Date(createdAt);
      scheduledFor.setDate(scheduledFor.getDate() + Math.floor(Math.random() * 7) + 1);
      scheduledFor = scheduledFor.toISOString();
    }
    
    let sentAt;
    if (status === 'sent') {
      sentAt = new Date(createdAt);
      sentAt.setHours(sentAt.getHours() + Math.floor(Math.random() * 48));
      sentAt = sentAt.toISOString();
    }
    
    const recipients = sendTo === 'specific' ? Math.floor(Math.random() * 1000) + 50 : undefined;
    const readCount = status === 'sent' ? Math.floor(Math.random() * 1000) : undefined;
    const openRate = status === 'sent' ? Math.floor(Math.random() * 100) : undefined;
    const clickRate = status === 'sent' ? Math.floor(Math.random() * 50) : undefined;
    
    return {
      id: `notif-${1000 + index}`,
      title: [
        'Sản phẩm mới đã ra mắt', 'Giảm giá lớn cuối tuần', 'Thông báo bảo trì hệ thống', 
        'Cập nhật chính sách bảo mật', 'Đơn hàng đã được giao', 'Khuyến mãi đặc biệt',
        'Chương trình khách hàng thân thiết', 'Mã giảm giá của bạn', 'Thông báo quan trọng',
        'Cập nhật ứng dụng', 'Ưu đãi flash sale', 'Lời mời tham gia sự kiện'
      ][index % 12],
      content: 'Nội dung thông báo chi tiết sẽ được hiển thị ở đây. Thông báo này có thể bao gồm các thông tin về sản phẩm, dịch vụ, hoặc các thông tin quan trọng khác cần được gửi đến người dùng.',
      type,
      sendTo,
      recipients,
      isScheduled,
      scheduledFor,
      createdAt: createdAt.toISOString(),
      sentAt,
      status,
      readCount,
      openRate,
      clickRate
    };
  });
};

const mockNotifications = generateMockNotifications();

// Status Badge Component
interface StatusBadgeProps {
  status: Notification['status'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  
  switch (status) {
    case 'draft':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      break;
    case 'sent':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'scheduled':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    case 'failed':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
  }
  
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
      {status === 'draft' && 'Bản nháp'}
      {status === 'sent' && 'Đã gửi'}
      {status === 'scheduled' && 'Đã lên lịch'}
      {status === 'failed' && 'Gửi lỗi'}
    </span>
  );
};

// Type Badge Component
interface TypeBadgeProps {
  type: Notification['type'];
}

const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
  let bgColor = '';
  let textColor = '';
  
  switch (type) {
    case 'general':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      break;
    case 'order':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    case 'promotion':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      break;
    case 'system':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case 'account':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
  }
  
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
      {type === 'general' && 'Chung'}
      {type === 'order' && 'Đơn hàng'}
      {type === 'promotion' && 'Khuyến mãi'}
      {type === 'system' && 'Hệ thống'}
      {type === 'account' && 'Tài khoản'}
    </span>
  );
};

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Notification>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Notification['type'] | ''>('');
  const [filterStatus, setFilterStatus] = useState<Notification['status'] | ''>('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Sorting
  const sortedNotifications = [...notifications].sort((a: any, b: any) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Filtering
  const filteredNotifications = sortedNotifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType ? notification.type === filterType : true;
    const matchesStatus = filterStatus ? notification.status === filterStatus : true;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const currentNotifications = filteredNotifications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  // Handlers
  const handleSort = (field: keyof Notification) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedNotifications(currentNotifications.map(notification => notification.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleSelectNotification = (id: string) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter(notificationId => notificationId !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterStatus('');
  };

  const handleDeleteNotification = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      setNotifications(notifications.filter(notification => notification.id !== id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedNotifications.length} thông báo đã chọn?`)) {
      setNotifications(notifications.filter(notification => !selectedNotifications.includes(notification.id)));
      setSelectedNotifications([]);
    }
  };

  const handleViewNotification = (notification: Notification) => {
    setCurrentNotification(notification);
    setShowNotificationModal(true);
  };

  const handleSendNotification = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? {
        ...notification,
        status: 'sent',
        sentAt: new Date().toISOString()
      } : notification
    ));
  };

  const handleBulkSend = () => {
    if (window.confirm(`Bạn có chắc chắn muốn gửi ${selectedNotifications.length} thông báo đã chọn?`)) {
      const now = new Date().toISOString();
      setNotifications(notifications.map(notification => 
        selectedNotifications.includes(notification.id) ? {
          ...notification,
          status: 'sent',
          sentAt: now
        } : notification
      ));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Bell className="mr-2" size={24} />
          Quản lý thông báo
        </h1>
        <div className="mt-4 md:mt-0">
          <a 
            href="/notifications/create" 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="mr-2" size={16} />
            Tạo thông báo mới
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
              placeholder="Tìm kiếm theo tiêu đề, nội dung..."
              className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[150px]"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as Notification['type'] | '')}
              >
                <option value="">Tất cả loại</option>
                <option value="general">Chung</option>
                <option value="order">Đơn hàng</option>
                <option value="promotion">Khuyến mãi</option>
                <option value="system">Hệ thống</option>
                <option value="account">Tài khoản</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[150px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Notification['status'] | '')}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="draft">Bản nháp</option>
                <option value="sent">Đã gửi</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="failed">Gửi lỗi</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Selected Items Actions */}
      {selectedNotifications.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-md flex items-center justify-between">
          <span className="text-indigo-700 font-medium">
            {selectedNotifications.length} thông báo được chọn
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button 
              onClick={handleBulkSend}
              className="px-3 py-1 bg-white text-green-600 border border-green-200 rounded-md hover:bg-green-50 flex items-center"
            >
              <Send className="h-4 w-4 mr-1" />
              <span>Gửi ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* Notifications Table */}
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
                    checked={selectedNotifications.length > 0 && selectedNotifications.length === currentNotifications.length}
                  />
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('title')}
                >
                  Tiêu đề
                  {sortField === 'title' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  Loại
                  {sortField === 'type' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Người nhận
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  Tạo lúc
                  {sortField === 'createdAt' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('sentAt')}
                >
                  Gửi lúc
                  {sortField === 'sentAt' && (
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
            {currentNotifications.map((notification) => (
              <tr key={notification.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                    />
                  </div>
                </td>
                <td className="px-3 py-4">
                  <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{notification.content}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <TypeBadge type={notification.type} />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-900">
                      {notification.sendTo === 'all' ? 'Tất cả người dùng' : `${notification.recipients} người dùng`}
                    </span>
                  </div>
                  {notification.status === 'sent' && notification.readCount !== undefined && (
                    <div className="text-xs text-gray-500 mt-1">
                      Đã đọc: {notification.readCount} ({notification.openRate}%)
                    </div>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-900">{formatDate(notification.createdAt)}</span>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {notification.sentAt ? (
                    <div className="flex items-center">
                      <Send className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-900">{formatDate(notification.sentAt)}</span>
                    </div>
                  ) : notification.isScheduled && notification.scheduledFor ? (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                      <span className="text-sm text-blue-600">{formatDate(notification.scheduledFor)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <StatusBadge status={notification.status} />
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex justify-center space-x-2">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900" 
                      title="Xem chi tiết"
                      onClick={() => handleViewNotification(notification)}
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    {notification.status === 'draft' && (
                      <>
                        <a 
                          href={`/notifications/${notification.id}/edit`}
                          className="text-blue-600 hover:text-blue-900" 
                          title="Sửa"
                        >
                          <Edit className="h-5 w-5" />
                        </a>
                        <button 
                          className="text-green-600 hover:text-green-900" 
                          title="Gửi ngay"
                          onClick={() => handleSendNotification(notification.id)}
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {notification.status !== 'sent' && (
                      <button 
                        className="text-red-600 hover:text-red-900" 
                        title="Xóa"
                        onClick={() => handleDeleteNotification(notification.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
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
            Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, filteredNotifications.length)}</span> của <span className="font-medium">{filteredNotifications.length}</span> thông báo
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

      {/* Notification Detail Modal */}
      {showNotificationModal && currentNotification && (
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      Chi tiết thông báo
                      <StatusBadge status={currentNotification.status} />
                    </h3>
                    
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex justify-between">
                          <TypeBadge type={currentNotification.type} />
                          <div className="text-sm text-gray-500">
                            ID: {currentNotification.id}
                          </div>
                        </div>
                        <h4 className="text-md font-medium text-gray-900 mt-2">{currentNotification.title}</h4>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500 font-medium mb-2">Nội dung thông báo:</div>
                        <p className="text-sm text-gray-900">{currentNotification.content}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500 font-medium">Người nhận:</div>
                          <div className="text-sm text-gray-900 mt-1">
                            {currentNotification.sendTo === 'all' 
                              ? 'Tất cả người dùng' 
                              : `${currentNotification.recipients} người dùng cụ thể`}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-500 font-medium">Thời gian tạo:</div>
                          <div className="text-sm text-gray-900 mt-1">
                            {formatDate(currentNotification.createdAt)}
                          </div>
                        </div>
                        
                        {currentNotification.sentAt && (
                          <div>
                            <div className="text-sm text-gray-500 font-medium">Thời gian gửi:</div>
                            <div className="text-sm text-gray-900 mt-1">
                              {formatDate(currentNotification.sentAt)}
                            </div>
                          </div>
                        )}
                        
                        {currentNotification.isScheduled && currentNotification.scheduledFor && (
                          <div>
                            <div className="text-sm text-gray-500 font-medium">Lên lịch gửi:</div>
                            <div className="text-sm text-gray-900 mt-1">
                              {formatDate(currentNotification.scheduledFor)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {currentNotification.status === 'sent' && (
                        <div className="bg-gray-50 p-3 rounded-md mt-4">
                          <div className="text-sm text-gray-500 font-medium mb-2">Thống kê:</div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <div className="text-sm text-gray-500">Đã đọc:</div>
                              <div className="text-sm font-medium text-gray-900">
                                {currentNotification.readCount} ({currentNotification.openRate}%)
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Tỷ lệ click:</div>
                              <div className="text-sm font-medium text-gray-900">
                                {currentNotification.clickRate}%
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {currentNotification.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => handleSendNotification(currentNotification.id)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Gửi ngay
                  </button>
                )}
                
                {currentNotification.status === 'draft' && (
                  <a
                    href={`/notifications/${currentNotification.id}/edit`}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Sửa
                  </a>
                )}
                
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowNotificationModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;