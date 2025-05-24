// src/features/auth/components/ForgotPassword/ForgotPasswordForm.tsx
import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/auth-hook';

const ForgotPasswordForm: React.FC = () => {
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: ''
  });
  
  const validateEmail = (): boolean => {
    if (!email) {
      setEmailError('Email là bắt buộc');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email không hợp lệ');
      return false;
    }
    
    setEmailError('');
    return true;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) validateEmail();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: result.message || 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.'
        });
        setEmail('');
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.'
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setNotification({
        type: 'error',
        message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
        </p>
        
        {/* Notification */}
        {notification.type && (
          <div className={`p-3 rounded-md mb-4 ${
            notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
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
        
        {/* Email field */}
        <div>
          <label htmlFor="forgot-password-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-gray-400" />
            </div>
            <input
              id="forgot-password-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleChange}
              className={`pl-10 w-full px-3 py-2 border ${
                emailError ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="email@example.com"
            />
          </div>
          {emailError && (
            <p className="mt-1 text-xs text-red-500">{emailError}</p>
          )}
        </div>
      </div>
      
      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#b75e41] text-white py-3 rounded-md font-medium hover:bg-[#a34e32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Gửi liên kết đặt lại mật khẩu'}
        </button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
