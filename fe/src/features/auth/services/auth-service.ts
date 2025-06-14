// 🚨 EMERGENCY FIX: Auth Service với User Data Corruption Fix
// File: fe/src/features/auth/services/auth-service.ts

import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  UpdateUserRequest,
  UpdatePasswordRequest,
  VerificationResponse,
} from '../interfaces/auth-interfaces';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// 🔧 Enhanced request interceptor with better token handling
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Skip frequent logging for /me
    const isFrequentEndpoint = config.url?.includes('/me');
    
    if (token) {
      try {
        // Enhanced token validation
        const parts = token.split('.');
        if (parts.length !== 3) {
          if (!isFrequentEndpoint) console.error('❌ Invalid token format');
          AuthService.clearAuthData();
          return config;
        }
        
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Date.now() / 1000;
        
        // Add 5 minute buffer for token expiration
        const bufferTime = 5 * 60;
        if (payload.exp < (currentTime + bufferTime)) {
          if (!isFrequentEndpoint) console.warn('⚠️ Token expiring soon or expired');
          AuthService.clearAuthData();
          return config;
        }
        
        config.headers.Authorization = `Bearer ${token}`;
        
      } catch (error) {
        if (!isFrequentEndpoint) console.error('❌ Token validation error:', error);
        AuthService.clearAuthData();
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Enhanced response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // 🔧 FIX: Cache successful /me responses with validation
    if (response.config.url?.includes('/me') && response.data?.user) {
      AuthService.setUserData(response.data.user);
    }
    return response;
  },
  (error) => {
    const { response, config } = error;
    const isFrequentEndpoint = config?.url?.includes('/me');
    
    // Handle rate limiting
    if (response?.status === 429) {
      if (!isFrequentEndpoint) {
        console.warn('⚠️ Rate limited:', config?.url);
      }
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized
    if (response?.status === 401) {
      AuthService.clearAuthData();
      
      const isAuthEndpoint = ['/login', '/register', '/forgot-password'].some(
        endpoint => config?.url?.includes(endpoint)
      );
      
      const isAuthPage = window.location.pathname.includes('/auth');
      
      if (!isAuthEndpoint && !isAuthPage) {
        console.log('🔄 Redirecting to login due to 401');
        window.location.href = '/auth/login?expired=true';
      }
    }
    
    return Promise.reject(error);
  }
);

class AuthService {
  // 🔧 Enhanced caching with corruption protection
  private userCache: User | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
  private readonly MIN_FETCH_INTERVAL = 30 * 1000; // 30 seconds

  /**
   * 🚨 FIXED: Safe user data storage with validation
   */
  static setUserData(user: User): void {
    try {
      if (!user || typeof user !== 'object' || !user.id || !user.email) {
        console.error('❌ Invalid user data provided:', user);
        return;
      }
      
      // Validate required fields
      const requiredFields = ['id', 'email', 'username', 'role'];
      const missingFields = requiredFields.filter(field => !user[field as keyof User]);
      
      if (missingFields.length > 0) {
        console.error('❌ User data missing required fields:', missingFields);
        return;
      }
      
      const userDataString = JSON.stringify(user);
      localStorage.setItem('user', userDataString);
      localStorage.setItem('lastUserFetch', Date.now().toString());
      
      console.log('✅ User data saved successfully:', {
        id: user.id,
        email: user.email,
        timestamp: new Date().toLocaleTimeString()
      });
      
    } catch (error) {
      console.error('❌ Failed to save user data:', error);
    }
  }

  /**
   * 🚨 FIXED: Safe user data retrieval with corruption handling
   */
  getCachedUser(): User | null {
    try {
      const userData = localStorage.getItem('user');
      
      // Handle empty or undefined data
      if (!userData || userData === 'undefined' || userData === 'null') {
        console.log('⚠️ No valid user data in localStorage');
        localStorage.removeItem('user');
        this.userCache = null;
        return null;
      }
      
      const parsedUser = JSON.parse(userData);
      
      // Validate parsed user structure
      if (!parsedUser || typeof parsedUser !== 'object') {
        console.error('❌ Invalid user data structure');
        localStorage.removeItem('user');
        this.userCache = null;
        return null;
      }
      
      // Validate required fields
      if (!parsedUser.id || !parsedUser.email || !parsedUser.username) {
        console.error('❌ User data missing required fields:', parsedUser);
        localStorage.removeItem('user');
        this.userCache = null;
        return null;
      }
      
      // Update cache
      this.userCache = parsedUser;
      
      console.log('✅ Valid user data retrieved:', {
        id: parsedUser.id,
        email: parsedUser.email,
        cached: true
      });
      
      return parsedUser;
      
    } catch (error) {
      console.error('❌ Error parsing cached user:', error);
      localStorage.removeItem('user');
      this.userCache = null;
      return null;
    }
  }

  /**
   * 🚨 FIXED: Smart getCurrentUser with intelligent caching
   */
  async getCurrentUser(): Promise<{ user: User }> {
    const now = Date.now();
    
    // Check cache freshness
    const lastUserFetch = localStorage.getItem('lastUserFetch');
    const cacheAge = lastUserFetch ? now - parseInt(lastUserFetch) : Infinity;
    
    // Use cache if:
    // 1. We have valid cached data
    // 2. Cache is fresh (< 2 minutes)
    // 3. Not hitting API too frequently (< 30 seconds)
    const hasValidCache = this.userCache && 
                         cacheAge < this.CACHE_DURATION && 
                         (now - this.lastFetchTime) < this.MIN_FETCH_INTERVAL;
                         
    if (hasValidCache) {
      console.log('📦 Using cached user data (age:', Math.round(cacheAge / 1000), 'seconds)');
      return { user: this.userCache! };
    }
    
    // Rate limiting check
    if ((now - this.lastFetchTime) < this.MIN_FETCH_INTERVAL) {
      console.log('⏰ Rate limited - trying cached data');
      const cachedUser = this.getCachedUser();
      if (cachedUser) {
        return { user: cachedUser };
      }
    }
    
    // Pre-flight token validation
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }
    
    try {
      this.lastFetchTime = now;
      console.log('🌐 Fetching user from API...');
      
      const response = await axiosInstance.get<{ user: User }>('/me');
      const userData = response.data.user;
      
      // Validate API response
      if (!userData || !userData.id || !userData.email) {
        throw new Error('Invalid user data from API');
      }
      
      // Update cache and localStorage
      this.userCache = userData;
      AuthService.setUserData(userData);
      
      console.log('✅ User fetched from API successfully');
      return response.data;
      
    } catch (error: any) {
      console.error('❌ API fetch failed:', error.message);
      
      // On auth errors, clear everything
      if (error.response?.status === 401) {
        AuthService.clearAuthData();
        throw error;
      }
      
      // On other errors, try cached data as fallback
      const cachedUser = this.getCachedUser();
      if (cachedUser) {
        console.log('📦 Using cached data due to API error');
        return { user: cachedUser };
      }
      
      throw error;
    }
  }

  /**
   * 🚨 FIXED: Enhanced token validation
   */
  isAuthenticated(): boolean {
    try {
      const token = localStorage.getItem('token');
      
      if (!token || token === 'undefined' || token === 'null') {
        AuthService.clearAuthData();
        return false;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        AuthService.clearAuthData();
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      
      // 5 minute buffer before token expires
      const bufferTime = 5 * 60;
      if (payload.exp < (currentTime + bufferTime)) {
        console.log('⚠️ Token expired or expiring soon');
        AuthService.clearAuthData();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      AuthService.clearAuthData();
      return false;
    }
  }

  /**
   * 🚨 FIXED: Safe auth data clearing
   */
  static clearAuthData(): void {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastUserFetch');
      console.log('✅ Auth data cleared');
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
    }
  }

  /**
   * 🚨 FIXED: Force refresh user data
   */
  async refreshUser(): Promise<{ user: User }> {
    this.userCache = null;
    this.lastFetchTime = 0;
    localStorage.removeItem('lastUserFetch');
    console.log('🔄 Force refreshing user data...');
    return this.getCurrentUser();
  }

  /**
   * Enhanced login with better data handling
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🚀 Starting login process');
      
      const response = await axiosInstance.post<LoginResponse>('/login', loginData);
      
      if (!response.data.token) {
        throw new Error('No token received from server');
      }
      
      // Validate token before storing
      try {
        const payload = JSON.parse(atob(response.data.token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp < currentTime) {
          throw new Error('Received expired token');
        }
        
        localStorage.setItem('token', response.data.token);
        AuthService.setUserData(response.data.user);
        
        console.log('✅ Login successful');
        
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
   * Enhanced logout
   */
  async logout(): Promise<void> {
    try {
      console.log('🚀 Starting logout');
      
      const token = localStorage.getItem('token');
      if (token) {
        await axiosInstance.get('/logout');
      }
      
    } catch (error) {
      console.warn('⚠️ Server logout failed, continuing with local logout');
    } finally {
      AuthService.clearAuthData();
      this.userCache = null;
      this.lastFetchTime = 0;
      console.log('✅ Logout completed');
    }
  }

  // Token utility methods
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

  getToken(): string | null {
    const token = localStorage.getItem('token');
    return (token && token !== 'undefined' && token !== 'null') ? token : null;
  }

  // Profile updates with enhanced error handling
  async updateUserProfile(userData: UpdateUserRequest): Promise<{ user: User }> {
    try {
      const response = await axiosInstance.put<{ user: User }>('/me', userData);
      
      // Update cache with new data
      this.userCache = response.data.user;
      AuthService.setUserData(response.data.user);
      
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
        AuthService.setUserData(response.data.user);
        
        // Reset cache
        this.userCache = response.data.user;
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Password update failed:', error);
      throw error;
    }
  }

  // Other methods remain the same...
  async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    try {
      console.log('🚀 Starting registration');
      
      const response = await axiosInstance.post<RegisterResponse>('/register', registerData);
      
      if (response.data.token) {
        try {
          localStorage.setItem('token', response.data.token);
          AuthService.setUserData(response.data.user);
          console.log('✅ Registration successful');
        } catch (tokenError) {
          console.warn('⚠️ Error storing registration data');
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
}

// Export singleton
export default new AuthService();

// 🚨 IMMEDIATE FIX SCRIPT - Add this to console to fix corrupted data
if (typeof window !== 'undefined') {
  (window as any).fixAuthData = () => {
    console.log('🔧 Fixing corrupted auth data...');
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Fix undefined/null user data
    if (!user || user === 'undefined' || user === 'null') {
      console.log('❌ Found corrupted user data, removing...');
      localStorage.removeItem('user');
    }
    
    // Fix undefined/null token
    if (!token || token === 'undefined' || token === 'null') {
      console.log('❌ Found corrupted token, removing...');
      localStorage.removeItem('token');
    }
    
    // Clean up
    if (!localStorage.getItem('lastUserFetch')) {
      localStorage.removeItem('lastUserFetch');
    }
    
    console.log('✅ Auth data cleanup completed');
    console.log('🔄 Refreshing page...');
    window.location.reload();
  };
  
  console.log('🛠️ Emergency fix available: run fixAuthData() in console');
}