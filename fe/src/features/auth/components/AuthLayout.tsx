import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  notification?: {
    type: 'success' | 'error';
    message: string;
  };
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, notification }) => {
  return (
    <div className="min-h-screen bg-[#f8f5f2] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        {/* Logo và tiêu đề */}
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold mb-1">Our Place</h1>
          <h2 className="text-xl font-medium">{title}</h2>
        </div>
        
        {/* Thông báo lỗi hoặc thành công */}
        {notification && (
          <div className={`p-3 rounded-md ${notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <CheckCircle size={18} className="mr-2 text-green-500" />
              ) : (
                <AlertCircle size={18} className="mr-2 text-red-500" />
              )}
              <p>{notification.message}</p>
            </div>
          </div>
        )}
        
        {/* Form content */}
        {children}
        
        {/* Phần footer */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-900">Điều khoản</a>
            <span>·</span>
            <a href="#" className="hover:text-gray-900">Bảo mật</a>
            <span>·</span>
            <a href="#" className="hover:text-gray-900">Liên hệ</a>
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">
            © 2025 Our Place. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 