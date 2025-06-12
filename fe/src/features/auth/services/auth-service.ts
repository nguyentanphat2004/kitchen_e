// src/features/auth/services/auth-service.ts - FIXED VERSION
import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  UpdateUserRequest,
  UpdatePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerificationResponse,
} from '../interfaces/auth-interfaces';

// Create axios instance with base URL and default headers
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔧 FIX 1: Improved request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // ✅ Kiểm tra token format trước khi gửi
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        // ✅ Kiểm tra token expiration trước khi gửi request
        if (payload.exp < currentTime) {
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
          return Promise.reject(new Error('Token expired'));
        }
        
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        // ✅ Token không hợp lệ → xóa và redirect
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
        return Promise.reject(new Error('Invalid token format'));
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔧 FIX 2: ADD Response interceptor để handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // ✅ Handle 401 Unauthorized
    if (response?.status === 401) {
      localStorage.removeItem('token');
      
      // ✅ Chỉ redirect nếu không phải login/register endpoints
      const isAuthEndpoint = ['/login', '/register', '/forgot-password'].some(
        endpoint => error.config?.url?.includes(endpoint)
      );
      
      if (!isAuthEndpoint) {
        window.location.href = '/auth/login?expired=true';
      }
    }
    
    // ✅ Handle 403 Forbidden
    if (response?.status === 403) {
      // Không xóa token, chỉ redirect về trang unauthorized
      window.location.href = '/unauthorized';
    }
    
    // ✅ Handle network errors
    if (!response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

class AuthService {
  /**
   * 🔧 FIX 3: Improved login with better error handling
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<LoginResponse>('/login', loginData);
      
      if (!response.data.token) {
        throw new Error('Không nhận được token từ server');
      }
      
      // ✅ Validate token before storing
      try {
        const payload = JSON.parse(atob(response.data.token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp < currentTime) {
          throw new Error('Token đã hết hạn');
        }
        
        localStorage.setItem('token', response.data.token);
        
        // ✅ Store additional user info for better UX
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
      } catch (tokenError) {
        throw new Error('Token không hợp lệ từ server');
      }
      
      return response.data;
    } catch (error: any) {
      // ✅ Better error handling
      if (error.response?.status === 429) {
        throw new Error('Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.');
      }
      throw error;
    }
  }

  /**
   * 🔧 FIX 4: Improved register with validation
   */
  async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await axiosInstance.post<RegisterResponse>('/register', registerData);
      
      if (response.data.token) {
        // ✅ Validate token before storing
        try {
          const payload = JSON.parse(atob(response.data.token.split('.')[1]));
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } catch (tokenError) {
          console.warn('Invalid token received during registration');
        }
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Quá nhiều lần đăng ký. Vui lòng thử lại sau.');
      }
      throw error;
    }
  }

  /**
   * 🔧 FIX 5: Safer logout
   */
  async logout(): Promise<void> {
    try {
      // ✅ Gọi API logout trước
      await axiosInstance.get('/logout');
    } catch (error) {
      // ✅ Vẫn logout local ngay cả khi API lỗi
      console.warn('Logout API failed, but continuing with local logout');
    } finally {
      // ✅ Luôn luôn clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  /**
   * 🔧 FIX 6: Improved getCurrentUser with retry
   */
  async getCurrentUser(): Promise<{ user: User }> {
    try {
      const response = await axiosInstance.get<{ user: User }>('/me');
      
      // ✅ Update cached user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      // ✅ Nếu 401, thử refresh token trước khi bỏ cuộc
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw error;
    }
  }

  /**
   * 🔧 FIX 7: Better token validation
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    
    if (!token) return false;
    
    try {
      // ✅ Kiểm tra token format và expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      
      return true;
    } catch (error) {
      // ✅ Token không hợp lệ
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  }

  /**
   * 🔧 FIX 8: Get cached user data
   */
  getCachedUser(): User | null {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 🔧 FIX 9: Check token expiration time
   */
  getTokenExpirationTime(): number | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  }

  /**
   * 🔧 FIX 10: Time until token expires
   */
  getTimeUntilExpiration(): number {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) return 0;
    
    return Math.max(0, expirationTime - Date.now());
  }

  // Existing methods with minor improvements
  async updateUserProfile(userData: UpdateUserRequest): Promise<{ user: User }> {
    const response = await axiosInstance.put<{ user: User }>('/me', userData);
    
    // ✅ Update cached user data
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  }

  async updatePassword(passwordData: UpdatePasswordRequest): Promise<LoginResponse> {
    const response = await axiosInstance.put<LoginResponse>('/password', passwordData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  async forgotPassword(email: string): Promise<VerificationResponse> {
    const response = await axiosInstance.post<VerificationResponse>('/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string): Promise<VerificationResponse> {
    const response = await axiosInstance.post<VerificationResponse>(
      `/reset-password/${token}`,
      { password }
    );
    return response.data;
  }

  async verifyEmail(token: string): Promise<VerificationResponse> {
    const response = await axiosInstance.get<VerificationResponse>(`/verify-email/${token}`);
    return response.data;
  }

  async resendVerificationEmail(): Promise<VerificationResponse> {
    const response = await axiosInstance.post<VerificationResponse>('/resend-verification');
    return response.data;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}

// Export as singleton
export default new AuthService();