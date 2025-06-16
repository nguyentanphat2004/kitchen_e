import React, { useState } from 'react';
import type { User } from '../../types/user-interfaces';
import { UserRoleBadge } from './UserRoleBadge';


interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (userId: string, newRole: User['role']) => void;
  isLoading?: boolean;
}

export const RoleChangeModal: React.FC<RoleChangeModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
  isLoading
}) => {
  const [selectedRole, setSelectedRole] = useState<User['role']>('customer');

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleConfirm = () => {
    if (user && selectedRole !== user.role) {
      onConfirm(user._id, selectedRole);
    }
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Thay đổi quyền người dùng</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Người dùng: <strong>{user.fullName || user.username}</strong>
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Quyền hiện tại: <UserRoleBadge role={user.role} size="sm" />
          </p>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quyền mới:
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as User['role'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            <option value="customer">Khách hàng</option>
            <option value="staff">Nhân viên</option>
            <option value="admin">Quản trị</option>
          </select>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            disabled={isLoading || selectedRole === user.role}
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};