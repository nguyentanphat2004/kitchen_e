// src/components/users/UserFilters.tsx
import { Search, Filter, X } from 'lucide-react';
import type { User, UserFilters } from '../../types/user-interfaces';

interface UserFiltersProps {
  filters: UserFilters;
  onFilterChange: (filters: Partial<UserFilters>) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

export const UserFiltersComponent: React.FC<UserFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  isLoading
}) => {
  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== false);

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 space-y-4">
      {/* Search and primary filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, username..."
            className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Role filter */}
          <div className="relative">
            <select
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[140px]"
              value={filters.role}
              onChange={(e) => onFilterChange({ role: e.target.value as any })}
              disabled={isLoading}
            >
              <option value="">Tất cả quyền</option>
              <option value="customer">Khách hàng</option>
              <option value="staff">Nhân viên</option>
              <option value="admin">Quản trị</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Auth provider filter */}
          <div className="relative">
            <select
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[140px]"
              value={filters.authProvider}
              onChange={(e) => onFilterChange({ authProvider: e.target.value as any })}
              disabled={isLoading}
            >
              <option value="">Tất cả nhà cung cấp</option>
              <option value="local">Đăng ký thường</option>
              <option value="google">Google</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          {/* Email verified filter */}
          <div className="relative">
            <select
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[140px]"
              value={filters.isEmailVerified.toString()}
              onChange={(e) => onFilterChange({ 
                isEmailVerified: e.target.value === '' ? '' : e.target.value === 'true' 
              })}
              disabled={isLoading}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đã xác thực</option>
              <option value="false">Chưa xác thực</option>
            </select>
          </div>

          {/* Show deleted filter */}
          <div className="relative">
            <select
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[120px]"
              value={filters.isDeleted.toString()}
              onChange={(e) => onFilterChange({ 
                isDeleted: e.target.value === '' ? '' : e.target.value === 'true' 
              })}
              disabled={isLoading}
            >
              <option value="false">Đang hoạt động</option>
              <option value="true">Đã xóa</option>
              <option value="">Tất cả</option>
            </select>
          </div>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="flex items-center">
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};