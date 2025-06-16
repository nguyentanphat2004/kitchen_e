import type { User } from "../../types/user-interfaces";

interface UserRoleBadgeProps {
    role: User['role'];
    size?: 'sm' | 'md' | 'lg';
  }
  
  export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ 
    role, 
    size = 'md' 
  }) => {
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-xs', 
      lg: 'px-3 py-1 text-sm'
    };
  
    const roleConfig = {
      customer: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Khách hàng'
      },
      staff: {
        bg: 'bg-purple-100',
        text: 'text-purple-800', 
        label: 'Nhân viên'
      },
      admin: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Quản trị'
      }
    };
  
    const config = roleConfig[role];
  
    return (
      <span 
        className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };