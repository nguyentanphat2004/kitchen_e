// src/components/users/UserStatusBadge.tsx
import React from 'react';
import type { User } from '../../types/user-interfaces';

interface UserStatusBadgeProps {
  status: 'active' | 'inactive' | 'blocked';
  size?: 'sm' | 'md' | 'lg';
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ 
  status, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  const statusConfig = {
    active: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Hoạt động'
    },
    inactive: {
      bg: 'bg-yellow-100', 
      text: 'text-yellow-800',
      label: 'Chưa xác thực'
    },
    blocked: {
      bg: 'bg-red-100',
      text: 'text-red-800', 
      label: 'Đã khóa'
    }
  };

  const config = statusConfig[status];

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};




