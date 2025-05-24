// src/features/auth/components/ResetPassword/ResetPasswordForm.tsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/auth-hook';

const ResetPasswordForm: React.FC = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    token?: string;
  }>({});
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: ''
  });
  
  const validateForm = (): boolean => {
    const errors: {
      password?: string;
      confirmPassword?: string;
      token?: string;
    } = {};
    let isValid = true;
    
    // Check if token exists
    if (!token) {
      errors.token = 'Token không hợp lệ hoặc bị thiếu';
      isValid = false;
    }
    
    // Validate password
    if (!formData.password) {
      errors.password = 'Mật khẩu là bắt buộc';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số';
      isValid = false;
    }
    
    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // We confirmed token exists in validateForm
      const result = await resetPassword(token!, formData.password);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: result.message || 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay bây giờ.'
        });
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setNotification({
        type: 'error',
        message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If no token provided, show error message
  if (!token) {
    return (
      <div className="p-3 rounded-md bg-red-50 text-red-700">
        <div className="flex items-center">
          <AlertCircle size={18} className="mr-2 text-red-500" />
          <p>Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.</p>
        </div>
        <button
          onClick={() => navigate('/auth/forgot-password')}
          className="mt-4 px-4 py-2 bg-[#b75e41] text-white rounded-md font-medium hover:bg-[#a34e32] transition-colors"
        >
          Yêu cầu liên kết mới
        </button>
      </div>
    );
  }
  
  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Notification */}
        {notification.type && (
          <div className={`p-3 rounded-md ${
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
        
        {/* Password field */}
        <div>
          <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu mới
          </label>
          <div className="relative">
            <input
              id="reset-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                formErrors.password ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff size={18} className="text-gray-400" />
              ) : (
                <Eye size={18} className="text-gray-400" />
              )}
            </button>
          </div>
          {formErrors.password && (
            <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.
          </p>
        </div>
        
        {/* Confirm password field */}
        <div>
          <label htmlFor="confirm-reset-password" className="block text-sm font-medium text-gray-700 mb-1">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <input
              id="confirm-reset-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff size={18} className="text-gray-400" />
              ) : (
                <Eye size={18} className="text-gray-400" />
              )}
            </button>
          </div>
          {formErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{formErrors.confirmPassword}</p>
          )}
        </div>
      </div>
      
      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting || notification.type === 'success'}
          className="w-full bg-[#b75e41] text-white py-3 rounded-md font-medium hover:bg-[#a34e32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
