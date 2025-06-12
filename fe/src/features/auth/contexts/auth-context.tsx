// src/features/auth/contexts/AuthContext.tsx - FIXED VERSION
import React, { createContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type  { 
  AuthState, 
  User, 
  LoginRequest, 
  RegisterRequest, 
  UpdateUserRequest,
  UpdatePasswordRequest 
} from '../interfaces/auth-interfaces';
import authService from '../services/auth-service';

// Define initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null
};

// Define action types
type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'USER_LOADED'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING' }
  | { type: 'TOKEN_EXPIRED' }; // 🔧 NEW: Handle token expiration

// Create context
interface AuthContextProps {
  state: AuthState;
  login: (loginData: LoginRequest) => Promise<void>;
  register: (registerData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: UpdateUserRequest) => Promise<void>;
  updatePassword: (passwordData: UpdatePasswordRequest) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  resendVerification: () => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
  refreshUser: () => Promise<void>; // 🔧 NEW: Manual user refresh
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Create reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null // 🔧 FIX: Clear error on successful update
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload
      };
    case 'TOKEN_EXPIRED': // 🔧 NEW: Handle token expiration separately
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true
      };
    default:
      return state;
  }
};

// Create provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();
  const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null); // 🔧 NEW: Token monitoring
  const loadUserAttempts = useRef(0); // 🔧 NEW: Prevent infinite retry
  const maxRetryAttempts = 3;

  // 🔧 FIX 1: Improved loadUser with better error handling
  const loadUser = useCallback(async (isRetry = false) => {
    try {
      // ✅ Check if token exists and is valid first
      if (!authService.isAuthenticated()) {
        dispatch({ type: 'AUTH_ERROR', payload: 'No valid authentication token' });
        return;
      }

      // ✅ Try to get cached user first for better UX
      const cachedUser = authService.getCachedUser();
      if (cachedUser && !isRetry) {
        dispatch({ type: 'USER_LOADED', payload: cachedUser });
        
        // ✅ Verify với server trong background
        try {
          const { user } = await authService.getCurrentUser();
          if (JSON.stringify(user) !== JSON.stringify(cachedUser)) {
            dispatch({ type: 'USER_LOADED', payload: user });
          }
        } catch (error) {
          // ✅ Nếu cached user hợp lệ, không cần báo lỗi
          console.warn('Failed to refresh user data:', error);
        }
        return;
      }

      // ✅ Fetch user from server
      const { user } = await authService.getCurrentUser();
      dispatch({ type: 'USER_LOADED', payload: user });
      loadUserAttempts.current = 0; // Reset retry counter
      
    } catch (error: any) {
      loadUserAttempts.current++;
      
      // ✅ Different handling based on error type
      if (error.response?.status === 401) {
        dispatch({ type: 'TOKEN_EXPIRED' });
      } else if (loadUserAttempts.current >= maxRetryAttempts) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.' });
      } else {
        // ✅ Retry after a delay
        setTimeout(() => loadUser(true), 2000);
      }
    }
  }, []);

  // 🔧 FIX 2: Token expiration monitoring
  const startTokenMonitoring = useCallback(() => {
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
    }

    tokenCheckInterval.current = setInterval(() => {
      const timeUntilExpiration = authService.getTimeUntilExpiration();
      
      // ✅ Token sắp hết hạn trong 5 phút
      if (timeUntilExpiration > 0 && timeUntilExpiration < 5 * 60 * 1000) {
        console.warn('Token sẽ hết hạn trong 5 phút');
        // TODO: Implement token refresh here
      }
      
      // ✅ Token đã hết hạn
      if (timeUntilExpiration <= 0 && state.isAuthenticated) {
        dispatch({ type: 'TOKEN_EXPIRED' });
        clearInterval(tokenCheckInterval.current!);
      }
    }, 60000); // Check every minute
  }, [state.isAuthenticated]);

  // 🔧 FIX 3: Cleanup monitoring on unmount
  useEffect(() => {
    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
  }, []);

  // Load user on first load and start monitoring
  useEffect(() => {
    loadUser();
    if (authService.isAuthenticated()) {
      startTokenMonitoring();
    }
  }, [loadUser, startTokenMonitoring]);

  // 🔧 FIX 4: Improved login with better error handling
  const login = async (loginData: LoginRequest) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const data = await authService.login(loginData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
      
      // ✅ Start token monitoring after successful login
      startTokenMonitoring();
      
      // ✅ Better navigation handling
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || '/shop';
      navigate(redirectTo);
    } catch (error: any) {
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      // ✅ Better error message handling
      if (error.response?.status === 401) {
        errorMessage = 'Email hoặc mật khẩu không đúng.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
    }
  };

  // 🔧 FIX 5: Improved register
  const register = async (registerData: RegisterRequest) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const data = await authService.register(registerData);
      dispatch({ type: 'REGISTER_SUCCESS', payload: data.user });
      
      // ✅ Start token monitoring after successful registration
      startTokenMonitoring();
      
      navigate('/shop');
    } catch (error: any) {
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      // ✅ Better error message handling
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.error?.message || 'Thông tin đăng ký không hợp lệ.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Email hoặc tên đăng nhập đã được sử dụng.';
      }
      
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
    }
  };

  // 🔧 FIX 6: Improved logout
  const logout = async () => {
    try {
      // ✅ Stop token monitoring
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
      
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      // ✅ Still log out on client side even if server request fails
      dispatch({ type: 'LOGOUT' });
      navigate('/auth');
    }
  };

  // 🔧 FIX 7: Better error handling for updateUser
  const updateUser = async (userData: UpdateUserRequest) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const { user } = await authService.updateUserProfile(userData);
      dispatch({ type: 'UPDATE_USER', payload: user });
    } catch (error: any) {
      let errorMessage = 'Cập nhật thông tin thất bại.';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.error?.message || 'Thông tin không hợp lệ.';
      } else if (error.response?.status === 401) {
        dispatch({ type: 'TOKEN_EXPIRED' });
        return;
      }
      
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // 🔧 FIX 8: Better error handling for updatePassword
  const updatePassword = async (passwordData: UpdatePasswordRequest) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const data = await authService.updatePassword(passwordData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
      
      // ✅ Restart token monitoring với token mới
      startTokenMonitoring();
    } catch (error: any) {
      let errorMessage = 'Cập nhật mật khẩu thất bại.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Mật khẩu hiện tại không đúng.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // 🔧 NEW: Manual user refresh
  const refreshUser = async () => {
    await loadUser(true);
  };

  // Existing methods with improved error handling
  const forgotPassword = async (email: string) => {
    try {
      const response = await authService.forgotPassword(email);
      return { success: true, message: response.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error?.message || 'Không thể gửi email đặt lại mật khẩu.' 
      };
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await authService.resetPassword(token, password);
      return { success: true, message: response.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error?.message || 'Đặt lại mật khẩu thất bại.' 
      };
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      const response = await authService.verifyEmail(token);
      if (state.user) {
        dispatch({ 
          type: 'UPDATE_USER', 
          payload: { ...state.user, isEmailVerified: true } 
        });
      }
      return { success: true, message: response.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error?.message || 'Xác thực email thất bại.' 
      };
    }
  };

  const resendVerification = async () => {
    try {
      const response = await authService.resendVerificationEmail();
      return { success: true, message: response.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error?.message || 'Gửi lại email xác thực thất bại.' 
      };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        register,
        logout,
        updateUser,
        updatePassword,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        refreshUser,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};