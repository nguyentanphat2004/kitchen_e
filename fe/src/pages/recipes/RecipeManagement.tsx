import React, { useState } from 'react';
import { 
  MessageSquare, Search, Filter, Edit, Trash2, Eye, 
  ArrowUpDown, ChevronLeft, ChevronRight, CheckCircle,
  XCircle, AlertTriangle, MessageCircle, Calendar, Package
} from 'lucide-react';

interface Review {
  id: string;
  productId: string;
  productName: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'reported';
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  adminResponse?: {
    content: string;
    createdAt: string;
  };
}

// Mock data
const generateMockReviews = (): Review[] => {
  const statuses: Review['status'][] = ['pending', 'approved', 'rejected', 'reported'];
  
  return Array(50).fill(null).map((_, index) => {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const hasAdminResponse = status === 'approved' && Math.random() > 0.7;
    
    const adminResponse = hasAdminResponse ? {
      content: 'Cảm ơn bạn đã đánh giá sản phẩm của chúng tôi. Chúng tôi rất vui vì bạn hài lòng với sản phẩm này.',
      createdAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    } : undefined;
    
    return {
      id: `review-${1000 + index}`,
      productId: `product-${2000 + Math.floor(Math.random() * 10)}`,
      productName: [
        'Dao nhà bếp đa năng', 'Bộ nồi inox 5 món', 'Chảo chống dính cao cấp', 
        'Máy xay sinh tố công suất lớn', 'Bếp gas âm', 'Lò nướng điện', 
        'Máy đánh trứng cầm tay', 'Thớt gỗ tự nhiên', 'Rổ đựng rau quả', 'Máy ép trái cây'
      ][index % 10],
      rating: Math.floor(Math.random() * 5) + 1,
      title: [
        'Sản phẩm tuyệt vời', 'Rất hài lòng', 'Chất lượng tốt', 'Giao hàng nhanh',
        'Không như mong đợi', 'Giá trị tốt', 'Sẽ mua lại', 'Hơi đắt', 'Đáng đồng tiền',
        'Nên cải thiện'
      ][Math.floor(Math.random() * 10)],
      content: 'Đây là nội dung đánh giá chi tiết về sản phẩm. Người dùng chia sẻ trải nghiệm, ưu điểm, nhược điểm và các ý kiến cá nhân về sản phẩm.',
      images: Math.random() > 0.7 ? ['/review-image-1.jpg', '/review-image-2.jpg'] : undefined,
      author: {
        id: `user-${3000 + Math.floor(Math.random() * 20)}`,
        name: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'][Math.floor(Math.random() * 5)],
        avatar: Math.random() > 0.5 ? `/avatar-${Math.floor(Math.random() * 5)}.jpg` : undefined,
      },
      createdAt: createdAt.toISOString(),
      status,
      isVerifiedPurchase: Math.random() > 0.2,
      helpfulCount: Math.floor(Math.random() * 50),
      adminResponse,
    };
  });
};

const mockReviews = generateMockReviews();

// Star Rating Component
interface StarRatingProps {
  rating: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <svg 
          key={i} 
          className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// Status Badge Component
interface StatusBadgeProps {
  status: Review['status'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  let icon = null;
  
  switch (status) {
    case 'pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      icon = <AlertTriangle size={14} className="mr-1" />;
      break;
    case 'approved':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      icon = <CheckCircle size={14} className="mr-1" />;
      break;
    case 'rejected':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      icon = <XCircle size={14} className="mr-1" />;
      break;
    case 'reported':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      icon = <AlertTriangle size={14} className="mr-1" />;
      break;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status === 'pending' && 'Chờ duyệt'}
      {status === 'approved' && 'Đã duyệt'}
      {status === 'rejected' && 'Từ chối'}
      {status === 'reported' && 'Báo cáo'}
    </span>
  );
};

const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Review>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Review['status'] | ''>('');
  const [filterRating, setFilterRating] = useState<number | ''>('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Sorting
  const sortedReviews = [...reviews].sort((a: any, b: any) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Filtering
  const filteredReviews = sortedReviews.filter(review => {
    const matchesSearch = 
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.author.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus ? review.status === filterStatus : true;
    const matchesRating = filterRating !== '' ? review.rating === filterRating : true;
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  const currentReviews = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

  // Handlers
  const handleSort = (field: keyof Review) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedReviews(currentReviews.map(review => review.id));
    } else {
      setSelectedReviews([]);
    }
  };

  const handleSelectReview = (id: string) => {
    if (selectedReviews.includes(id)) {
      setSelectedReviews(selectedReviews.filter(reviewId => reviewId !== id));
    } else {
      setSelectedReviews([...selectedReviews, id]);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterRating('');
  };

  const handleViewReview = (review: Review) => {
    setCurrentReview(review);
    setAdminResponse(review.adminResponse?.content || '');
    setShowReviewModal(true);
  };

  const handleDeleteReview = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      setReviews(reviews.filter(review => review.id !== id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedReviews.length} đánh giá đã chọn?`)) {
      setReviews(reviews.filter(review => !selectedReviews.includes(review.id)));
      setSelectedReviews([]);
    }
  };

  const handleBulkApprove = () => {
    setReviews(reviews.map(review => 
      selectedReviews.includes(review.id) ? { ...review, status: 'approved' } : review
    ));
  };

  const handleBulkReject = () => {
    setReviews(reviews.map(review => 
      selectedReviews.includes(review.id) ? { ...review, status: 'rejected' } : review
    ));
  };

  const handleApproveReview = (id: string) => {
    setReviews(reviews.map(review => 
      review.id === id ? { ...review, status: 'approved' } : review
    ));
  };

  const handleRejectReview = (id: string) => {
    setReviews(reviews.map(review => 
      review.id === id ? { ...review, status: 'rejected' } : review
    ));
  };

  const handleSubmitResponse = () => {
    if (currentReview) {
      setReviews(reviews.map(review => 
        review.id === currentReview.id ? { 
          ...review, 
          status: 'approved',
          adminResponse: {
            content: adminResponse,
            createdAt: new Date().toISOString()
          }
        } : review
      ));
      setShowReviewModal(false);
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
          <MessageSquare className="mr-2" size={24} />
          Quản lý đánh giá sản phẩm
        </h1>
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
              placeholder="Tìm kiếm theo sản phẩm, nội dung, người dùng..."
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
                onChange={(e) => setFilterStatus(e.target.value as Review['status'] | '')}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="reported">Báo cáo</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[150px]"
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Tất cả đánh giá</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
            >
              Xóa bộ lọc
            </button>
            
            <div className="relative ml-auto">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value={10}>10 mục</option>
                <option value={25}>25 mục</option>
                <option value={50}>50 mục</option>
                <option value={100}>100 mục</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Items Actions */}
      {selectedReviews.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-md flex items-center justify-between">
          <span className="text-indigo-700 font-medium">
            {selectedReviews.length} đánh giá được chọn
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button 
              onClick={handleBulkApprove}
              className="px-3 py-1 bg-white text-green-600 border border-green-200 rounded-md hover:bg-green-50 flex items-center"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>Duyệt</span>
            </button>
            <button 
              onClick={handleBulkReject}
              className="px-3 py-1 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50 flex items-center"
            >
              <XCircle className="h-4 w-4 mr-1" />
              <span>Từ chối</span>
            </button>
          </div>
        </div>
      )}

      {/* Reviews Table */}
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
                    checked={selectedReviews.length > 0 && selectedReviews.length === currentReviews.length}
                  />
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('productName')}
                >
                  Sản phẩm
                  {sortField === 'productName' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('rating')}
                >
                  Đánh giá
                  {sortField === 'rating' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nội dung
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Người dùng
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  Ngày đăng
                  {sortField === 'createdAt' && (
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
            {currentReviews.map((review) => (
              <tr key={review.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={selectedReviews.includes(review.id)}
                      onChange={() => handleSelectReview(review.id)}
                    />
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {review.productName}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <StarRating rating={review.rating} />
                </td>
                <td className="px-3 py-4">
                  <div className="text-sm font-medium text-gray-900">{review.title}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{review.content}</div>
                  {review.images && review.images.length > 0 && (
                    <div className="mt-1 text-xs text-indigo-600">{review.images.length} ảnh đính kèm</div>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 flex-shrink-0 mr-2">
                      {review.author.avatar ? (
                        <img
                          src={review.author.avatar}
                          alt={review.author.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">
                            {review.author.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{review.author.name}</div>
                      {review.isVerifiedPurchase && (
                        <div className="text-xs text-green-600">Mua hàng đã xác thực</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(review.createdAt)}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <StatusBadge status={review.status} />
                  {review.adminResponse && (
                    <div className="mt-1 text-xs text-gray-600 flex items-center">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Đã phản hồi
                    </div>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900" 
                      title="Xem và phản hồi"
                      onClick={() => handleViewReview(review)}
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    {review.status === 'pending' && (
                      <>
                        <button 
                          className="text-green-600 hover:text-green-900" 
                          title="Duyệt"
                          onClick={() => handleApproveReview(review.id)}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900" 
                          title="Từ chối"
                          onClick={() => handleRejectReview(review.id)}
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <button 
                      className="text-red-600 hover:text-red-900" 
                      title="Xóa"
                      onClick={() => handleDeleteReview(review.id)}
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
            Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, filteredReviews.length)}</span> của <span className="font-medium">{filteredReviews.length}</span> đánh giá
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

      {/* Review Detail Modal */}
      {showReviewModal && currentReview && (
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
                      Chi tiết đánh giá
                      <StatusBadge status={currentReview.status} />
                    </h3>
                    
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-3">
                            {currentReview.author.avatar ? (
                              <img
                                src={currentReview.author.avatar}
                                alt={currentReview.author.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-500">
                                  {currentReview.author.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{currentReview.author.name}</div>
                            {currentReview.isVerifiedPurchase && (
                              <div className="text-xs text-green-600">Mua hàng đã xác thực</div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(currentReview.createdAt)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between">
                          <StarRating rating={currentReview.rating} />
                          <div className="text-sm text-gray-500">
                            {currentReview.helpfulCount} người thấy hữu ích
                          </div>
                        </div>
                        <h4 className="text-md font-medium text-gray-900 mt-2">{currentReview.title}</h4>
                        <p className="text-sm text-gray-700 mt-1">{currentReview.content}</p>
                        
                        {currentReview.images && currentReview.images.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700">Hình ảnh đính kèm:</p>
                            <div className="flex flex-wrap mt-2 gap-2">
                              {currentReview.images.map((image, index) => (
                                <div key={index} className="h-20 w-20 rounded-md bg-gray-200 overflow-hidden">
                                  <img
                                    src={image}
                                    alt={`Review image ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Sản phẩm:</p>
                        <div className="flex items-center mt-1">
                          <Package className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{currentReview.productName}</span>
                        </div>
                      </div>
                      
                      {currentReview.adminResponse && (
                        <div className="mt-4 bg-gray-50 p-3 rounded-md">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">Phản hồi của cửa hàng:</p>
                            <div className="text-xs text-gray-500">
                              {formatDate(currentReview.adminResponse.createdAt)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{currentReview.adminResponse.content}</p>
                        </div>
                      )}
                      
                      <div>
                        <label htmlFor="admin-response" className="block text-sm font-medium text-gray-700">
                          Phản hồi
                        </label>
                        <textarea
                          id="admin-response"
                          rows={4}
                          className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={adminResponse}
                          onChange={(e) => setAdminResponse(e.target.value)}
                          placeholder="Nhập phản hồi của bạn..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmitResponse}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Phê duyệt và phản hồi
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveReview(currentReview.id)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Chỉ phê duyệt
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectReview(currentReview.id)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowReviewModal(false)}
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

export default ReviewManagement;