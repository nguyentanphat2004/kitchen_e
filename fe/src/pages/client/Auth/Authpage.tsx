import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Facebook, Twitter, CheckCircle, Info, AlertCircle } from 'lucide-react';

// Interface cho thông tin đăng nhập
interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Interface cho thông tin đăng ký
interface SignupForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  newsletter: boolean;
}

// Interface cho thông tin quên mật khẩu
interface ForgotPasswordForm {
  email: string;
}

// Component cho trang đăng nhập/đăng ký
const AuthPage: React.FC = () => {
  // Trạng thái xác thực hiện tại (login, signup, forgot-password)
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  
  // State cho form đăng nhập
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  // State cho form đăng ký
  const [signupForm, setSignupForm] = useState<SignupForm>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    newsletter: true
  });
  
  // State cho form quên mật khẩu
  const [forgotPasswordForm, setForgotPasswordForm] = useState<ForgotPasswordForm>({
    email: ''
  });
  
  // State để hiển thị/ẩn mật khẩu
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  // State cho thông báo lỗi hoặc thành công
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: ''
  });
  
  // Hàm xử lý đăng nhập
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mô phỏng kiểm tra đăng nhập
    if (!loginForm.email || !loginForm.password) {
      setNotification({
        type: 'error',
        message: 'Vui lòng điền đầy đủ thông tin đăng nhập.'
      });
      return;
    }
    
    // Mô phỏng đăng nhập thành công
    setNotification({
      type: 'success',
      message: 'Đăng nhập thành công! Đang chuyển hướng...'
    });
    
    // Trong thực tế, đây là nơi gọi API đăng nhập
    console.log('Đăng nhập với:', loginForm);
    
    // Mô phỏng chuyển hướng sau khi đăng nhập
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };
  
  // Hàm xử lý đăng ký
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra thông tin đăng ký
    if (!signupForm.fullName || !signupForm.email || !signupForm.password || !signupForm.confirmPassword) {
      setNotification({
        type: 'error',
        message: 'Vui lòng điền đầy đủ thông tin đăng ký.'
      });
      return;
    }
    
    if (signupForm.password !== signupForm.confirmPassword) {
      setNotification({
        type: 'error',
        message: 'Mật khẩu xác nhận không khớp.'
      });
      return;
    }
    
    if (!signupForm.acceptTerms) {
      setNotification({
        type: 'error',
        message: 'Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.'
      });
      return;
    }
    
    // Mô phỏng đăng ký thành công
    setNotification({
      type: 'success',
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.'
    });
    
    // Trong thực tế, đây là nơi gọi API đăng ký
    console.log('Đăng ký với:', signupForm);
  };
  
  // Hàm xử lý quên mật khẩu
  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra email
    if (!forgotPasswordForm.email) {
      setNotification({
        type: 'error',
        message: 'Vui lòng nhập địa chỉ email của bạn.'
      });
      return;
    }
    
    // Mô phỏng gửi email đặt lại mật khẩu thành công
    setNotification({
      type: 'success',
      message: 'Chúng tôi đã gửi email hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.'
    });
    
    // Trong thực tế, đây là nơi gọi API quên mật khẩu
    console.log('Quên mật khẩu với email:', forgotPasswordForm.email);
  };
  
  // Hàm xử lý thay đổi giá trị trong form đăng nhập
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Hàm xử lý thay đổi giá trị trong form đăng ký
  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSignupForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Hàm xử lý thay đổi giá trị trong form quên mật khẩu
  const handleForgotPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForgotPasswordForm(prev => ({
      ...prev,
      email: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-[#f8f5f2] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        {/* Logo và tiêu đề */}
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold mb-1">Our Place</h1>
          {authMode === 'login' && <h2 className="text-xl font-medium">Đăng nhập vào tài khoản</h2>}
          {authMode === 'signup' && <h2 className="text-xl font-medium">Tạo tài khoản mới</h2>}
          {authMode === 'forgot-password' && <h2 className="text-xl font-medium">Quên mật khẩu</h2>}
        </div>
        
        {/* Thông báo lỗi hoặc thành công */}
        {notification.type && (
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
        
        {/* Form đăng nhập */}
        {authMode === 'login' && (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot-password')}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={18} className="text-gray-400" />
                    ) : (
                      <Eye size={18} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  checked={loginForm.rememberMe}
                  onChange={handleLoginChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Ghi nhớ đăng nhập
                </label>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full bg-[#b75e41] text-white py-3 rounded-md font-medium hover:bg-[#a34e32] transition-colors"
              >
                Đăng nhập
              </button>
            </div>
            
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">hoặc đăng nhập với</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Facebook size={18} className="text-blue-600 mr-2" />
                <span>Facebook</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Twitter size={18} className="text-blue-400 mr-2" />
                <span>Twitter</span>
              </button>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          </form>
        )}
        
        {/* Form đăng ký */}
        {authMode === 'signup' && (
          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={signupForm.fullName}
                  onChange={handleSignupChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={signupForm.email}
                  onChange={handleSignupChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={signupForm.password}
                    onChange={handleSignupChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={18} className="text-gray-400" />
                    ) : (
                      <Eye size={18} className="text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.
                </p>
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={signupForm.confirmPassword}
                    onChange={handleSignupChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} className="text-gray-400" />
                    ) : (
                      <Eye size={18} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="accept-terms"
                    name="acceptTerms"
                    type="checkbox"
                    required
                    checked={signupForm.acceptTerms}
                    onChange={handleSignupChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-700">
                    Tôi đồng ý với{' '}
                    <a href="#" className="text-blue-600 hover:underline">Điều khoản dịch vụ</a>
                    {' '}và{' '}
                    <a href="#" className="text-blue-600 hover:underline">Chính sách bảo mật</a>
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="newsletter"
                    name="newsletter"
                    type="checkbox"
                    checked={signupForm.newsletter}
                    onChange={handleSignupChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-700">
                    Tôi muốn nhận thông tin về sản phẩm mới và khuyến mãi
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full bg-[#b75e41] text-white py-3 rounded-md font-medium hover:bg-[#a34e32] transition-colors"
              >
                Đăng ký
              </button>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Đăng nhập
                </button>
              </p>
            </div>
          </form>
        )}
        
        {/* Form quên mật khẩu */}
        {authMode === 'forgot-password' && (
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
              </p>
              
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
                    required
                    value={forgotPasswordForm.email}
                    onChange={handleForgotPasswordChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full bg-[#b75e41] text-white py-3 rounded-md font-medium hover:bg-[#a34e32] transition-colors"
              >
                Gửi liên kết đặt lại mật khẩu
              </button>
            </div>
            
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-blue-600 hover:underline font-medium"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        )}
        
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

// Variant trang đăng nhập với hình ảnh nền
const AuthPageWithImage: React.FC = () => {
  return (
    <div className="min-h-screen flex">
      {/* Phần hình ảnh bên trái */}
      <div className="hidden lg:block lg:w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('https://i.imgur.com/1hDUYym.jpg')" }}>
        <div className="h-full w-full bg-black bg-opacity-30 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <h1 className="text-4xl font-serif font-bold mb-4">Our Place</h1>
            <p className="text-xl max-w-md">Sản phẩm nhà bếp nổi bật, hiệu quả, không chứa hóa chất độc hại.</p>
          </div>
        </div>
      </div>
      
      {/* Phần form đăng nhập bên phải */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <AuthPage />
      </div>
    </div>
  );
};

export { AuthPage, AuthPageWithImage };
export default AuthPage;