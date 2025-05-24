// src/features/auth/pages/VerifyEmailPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../hooks/auth-hook';

const VerifyEmailPage: React.FC = () => {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [verificationStatus, setVerificationStatus] = useState<{
    loading: boolean;
    success: boolean;
    message: string;
  }>({
    loading: true,
    success: false,
    message: 'Đang xác thực email của bạn...'
  });
  
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setVerificationStatus({
          loading: false,
          success: false,
          message: 'Token xác thực không hợp lệ hoặc bị thiếu.'
        });
        return;
      }
      
      try {
        const result = await verifyEmail(token);
        
        setVerificationStatus({
          loading: false,
          success: result.success,
          message: result.message
        });
        
        // Redirect to login page after 3 seconds if successful
        if (result.success) {
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus({
          loading: false,
          success: false,
          message: 'Đã xảy ra lỗi khi xác thực email. Vui lòng thử lại sau.'
        });
      }
    };
    
    verify();
  }, [token, verifyEmail, navigate]);
  
  return (
    <div className="min-h-screen bg-[#f8f5f2] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        {/* Logo và tiêu đề */}
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold mb-1">Our Place</h1>
          <h2 className="text-xl font-medium">Xác thực email</h2>
        </div>
        
        {/* Verification status */}
        <div className={`p-6 rounded-md text-center ${
          verificationStatus.loading ? 'bg-blue-50' :
          verificationStatus.success ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex flex-col items-center justify-center">
            {verificationStatus.loading ? (
              <Loader size={48} className="text-blue-500 animate-spin mb-4" />
            ) : verificationStatus.success ? (
              <CheckCircle size={48} className="text-green-500 mb-4" />
            ) : (
              <AlertCircle size={48} className="text-red-500 mb-4" />
            )}
            
            <h3 className={`text-lg font-medium ${
              verificationStatus.loading ? 'text-blue-700' :
              verificationStatus.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {verificationStatus.loading ? 'Đang xử lý' :
               verificationStatus.success ? 'Xác thực thành công' : 'Xác thực thất bại'}
            </h3>
            
            <p className={`mt-2 ${
              verificationStatus.loading ? 'text-blue-600' :
              verificationStatus.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {verificationStatus.message}
            </p>
            
            {verificationStatus.success && (
              <p className="mt-2 text-green-600">
                Bạn sẽ được chuyển hướng đến trang đăng nhập trong vài giây...
              </p>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-center space-x-4 mt-6">
          <Link
            to="/auth"
            className="px-4 py-2 bg-[#b75e41] text-white rounded-md font-medium hover:bg-[#a34e32] transition-colors"
          >
            Đến trang đăng nhập
          </Link>
          
          {!verificationStatus.success && !verificationStatus.loading && (
            <Link
              to="/auth"
              className="px-4 py-2 border border-[#b75e41] text-[#b75e41] rounded-md font-medium hover:bg-[#f8f5f2] transition-colors"
            >
              Yêu cầu link mới
            </Link>
          )}
        </div>
        
        {/* Footer */}
        <div className="pt-4 border-t border-gray-200 mt-6">
          <p className="text-center text-xs text-gray-500">
            © 2025 Our Place. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
