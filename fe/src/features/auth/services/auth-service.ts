// src/features/auth/services/auth-service.ts - COMPLETE FIX
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
  timeout: 30000, // 30 second timeout
});

// 🔧 FIXED: Enhanced request interceptor with better token handling
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Only log for non-frequent endpoints
    if (!config.url?.includes('/me')) {
      console.log('🔍 AuthService Request:', {
        url: config.url,
        method: config.method,
        hasToken: !!token
      });
    }
    
    if (token) {
      try {
        // 🔧 Validate token format
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error('❌ Invalid token format');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return config;
        }
        
        // 🔧 Check expiration before sending
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp < currentTime) {
          console.error('❌ Token expired, removing from storage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return config;
        }
        
        // 🔧 Set proper Authorization header
        config.headers.Authorization = `Bearer ${token}`;
        
        if (!config.url?.includes('/me')) {
          console.log('✅ Authorization header set');
        }
        
      } catch (error) {
        console.error('❌ Token validation error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 🔧 FIXED: Enhanced response interceptor with better error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Only log for non-frequent endpoints
    if (!response.config.url?.includes('/me')) {
      console.log('✅ AuthService Response:', {
        status: response.status,
        url: response.config.url
      });
    }
    return response;
  },
  (error) => {
    const { response, config } = error;
    
    // Only log for non-frequent endpoints or errors
    if (!config?.url?.includes('/me') || response?.status !== 429) {
      console.error('❌ AuthService Error:', {
        status: response?.status,
        url: config?.url,
        message: response?.data?.message || error.message
      });
    }
    
    // 🔧 Handle 401 Unauthorized
    if (response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not on auth pages
      const isAuthEndpoint = ['/login', '/register', '/forgot-password'].some(
        endpoint => config?.url?.includes(endpoint)
      );
      
      const isAuthPage = window.location.pathname.includes('/auth');
      
      if (!isAuthEndpoint && !isAuthPage) {
        console.log('🔄 Redirecting to login due to 401');
        window.location.href = '/auth/login?expired=true';
      }
    }
    
    // 🔧 Handle 403 Forbidden
    if (response?.status === 403) {
      const isUnauthorizedPage = window.location.pathname.includes('/unauthorized');
      if (!isUnauthorizedPage) {
        window.location.href = '/unauthorized';
      }
    }
    
    // 🔧 Handle 429 Rate Limiting (don't spam logs)
    if (response?.status === 429) {
      if (!config?.url?.includes('/me')) {
        console.warn('⚠️ Rate limited:', config?.url);
      }
    }
    
    return Promise.reject(error);
  }
);

class AuthService {
  /**
   * 🔧 FIXED: Enhanced login with validation
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🚀 Starting login process');
      
      const response = await axiosInstance.post<LoginResponse>('/login', loginData);
      
      if (!response.data.token) {
        throw new Error('No token received from server');
      }
      
      // 🔧 Validate token before storing
      try {
        const payload = JSON.parse(atob(response.data.token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp < currentTime) {
          throw new Error('Received expired token');
        }
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('✅ Login successful, token stored');
        
      } catch (tokenError) {
        console.error('❌ Token validation failed:', tokenError);
        throw new Error('Invalid token from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      
      throw error;
    }
  }

  /**
   * 🔧 FIXED: Enhanced getCurrentUser with better error handling
   */
  async getCurrentUser(): Promise<{ user: User }> {
    try {
      // 🔧 Pre-flight validation
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }
      
      // Validate token format and expiration
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }
      
      const response = await axiosInstance.get<{ user: User }>('/me');
      
      // Update cached user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      // Clear auth data on specific errors
      if (error.response?.status === 401 || error.message.includes('expired') || error.message.includes('Invalid')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      throw error;
    }
  }

  /**
   * 🔧 FIXED: Enhanced register
   */
  async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    try {
      console.log('🚀 Starting registration');
      
      const response = await axiosInstance.post<RegisterResponse>('/register', registerData);
      
      if (response.data.token) {
        try {
          const payload = JSON.parse(atob(response.data.token.split('.')[1]));
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          console.log('✅ Registration successful');
        } catch (tokenError) {
          console.warn('⚠️ Invalid token during registration');
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      
      if (error.response?.status === 429) {
        throw new Error('Too many registration attempts. Please try again later.');
      }
      
      throw error;
    }
  }

  /**
   * 🔧 FIXED: Enhanced logout
   */
  async logout(): Promise<void> {
    try {
      console.log('🚀 Starting logout');
      
      // Try server logout if token exists
      const token = localStorage.getItem('token');
      if (token) {
        await axiosInstance.get('/logout');
      }
      
    } catch (error) {
      console.warn('⚠️ Server logout failed, continuing with local logout');
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('✅ Logout completed');
    }
  }

  /**
   * 🔧 FIXED: Enhanced token validation
   */
  isAuthenticated(): boolean {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return false;
      }
      
      // Validate format
      const parts = token.split('.');
      if (parts.length !== 3) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      
      // Check expiration
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        localStorage.removeItem('token');
        localStorage.removeUser('user');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  }

  /**
   * 🔧 FIXED: Safe cached user retrieval
   */
  getCachedUser(): User | null {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Error parsing cached user:', error);
      localStorage.removeItem('user');
      return null;
    }
  }

  /**
   * 🔧 FIXED: Token expiration utilities
   */
  getTokenExpirationTime(): number | null {
    try {
      const token = this.getToken();
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000;
    } catch (error) {
      return null;
    }
  }

  getTimeUntilExpiration(): number {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) return 0;
    
    return Math.max(0, expirationTime - Date.now());
  }

  // 🔧 Profile and password updates with enhanced error handling
  async updateUserProfile(userData: UpdateUserRequest): Promise<{ user: User }> {
    try {
      const response = await axiosInstance.put<{ user: User }>('/me', userData);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  }

  async updatePassword(passwordData: UpdatePasswordRequest): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.put<LoginResponse>('/password', passwordData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Password update failed:', error);
      throw error;
    }
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

  /**
   * 🔧 NEW: Debug helper methods
   */
  async testConnection(): Promise<any> {
    try {
      const response = await axiosInstance.get('/debug/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async validateCurrentToken(): Promise<any> {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No token to validate');
      
      const response = await axiosInstance.post('/debug/validate', { token });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export as singleton
export default new AuthService();