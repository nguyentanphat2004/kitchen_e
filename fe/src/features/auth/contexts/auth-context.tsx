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
  | { type: 'TOKEN_EXPIRED' }
  | { type: 'NETWORK_ERROR' }; // 🔧 NEW: Handle network errors

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
  refreshUser: () => Promise<void>;
  loadUser: () => Promise<void>; // 🔧 NEW: Expose loadUser
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
        error: null
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload
      };
    case 'NETWORK_ERROR': // 🔧 NEW: Handle network errors differently
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'TOKEN_EXPIRED':
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
  
  // 🔧 FIX 1: Better ref management
  const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const loadUserAttempts = useRef(0);
  const isComponentMounted = useRef(true);
  const retryTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());
  
  const maxRetryAttempts = 3;
  const retryDelays = [1000, 3000, 5000]; // Progressive delays

  // 🔧 FIX 2: Cleanup function
  const cleanup = useCallback(() => {
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
      tokenCheckInterval.current = null;
    }
    
    // Clear all retry timeouts
    retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
    retryTimeouts.current.clear();
  }, []);

  // 🔧 FIX 3: Component cleanup on unmount
  useEffect(() => {
    isComponentMounted.current = true;
    
    return () => {
      isComponentMounted.current = false;
      cleanup();
    };
  }, [cleanup]);

  // 🔧 FIX 4: Improved loadUser with exponential backoff
  const loadUser = useCallback(async (isRetry = false, forceRefresh = false) => {
    // Don't proceed if component is unmounted
    if (!isComponentMounted.current) return;

    try {
      // ✅ Check if token exists and is valid first
      if (!authService.isAuthenticated()) {
        if (isComponentMounted.current) {
          dispatch({ type: 'AUTH_ERROR', payload: 'No valid authentication token' });
        }
        return;
      }

      // ✅ Try to get cached user first for better UX (if not forcing refresh)
      if (!forceRefresh && !isRetry) {
        const cachedUser = authService.getCachedUser();
        if (cachedUser && isComponentMounted.current) {
          dispatch({ type: 'USER_LOADED', payload: cachedUser });
          
          // ✅ Verify with server in background
          setTimeout(() => {
            if (isComponentMounted.current) {
              loadUser(true, true);
            }
          }, 1000);
          return;
        }
      }

      // ✅ Fetch user from server
      const { user } = await authService.getCurrentUser();
      
      if (isComponentMounted.current) {
        dispatch({ type: 'USER_LOADED', payload: user });
        loadUserAttempts.current = 0; // Reset retry counter
      }
      
    } catch (error: any) {
      if (!isComponentMounted.current) return;

      loadUserAttempts.current++;
      
      console.error('LoadUser error:', error);
      
      // ✅ Different handling based on error type
      if (error.response?.status === 401) {
        dispatch({ type: 'TOKEN_EXPIRED' });
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        if (loadUserAttempts.current >= maxRetryAttempts) {
          dispatch({ type: 'NETWORK_ERROR', payload: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.' });
        } else {
          // ✅ Exponential backoff retry
          const delay = retryDelays[loadUserAttempts.current - 1] || 5000;
          const timeout = setTimeout(() => {
            if (isComponentMounted.current) {
              retryTimeouts.current.delete(timeout);
              loadUser(true, forceRefresh);
            }
          }, delay);
          retryTimeouts.current.add(timeout);
        }
      } else if (loadUserAttempts.current >= maxRetryAttempts) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.' });
      } else {
        // ✅ Retry with exponential backoff
        const delay = retryDelays[loadUserAttempts.current - 1] || 5000;
        const timeout = setTimeout(() => {
          if (isComponentMounted.current) {
            retryTimeouts.current.delete(timeout);
            loadUser(true, forceRefresh);
          }
        }, delay);
        retryTimeouts.current.add(timeout);
      }
    }
  }, []);

  // 🔧 FIX 5: Improved token expiration monitoring
  const startTokenMonitoring = useCallback(() => {
    // Clear existing interval
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
      tokenCheckInterval.current = null;
    }

    // Only start monitoring if user is authenticated
    if (!state.isAuthenticated) return;

    tokenCheckInterval.current = setInterval(() => {
      if (!isComponentMounted.current) {
        if (tokenCheckInterval.current) {
          clearInterval(tokenCheckInterval.current);
          tokenCheckInterval.current = null;
        }
        return;
      }

      const timeUntilExpiration = authService.getTimeUntilExpiration();
      
      // ✅ Token sắp hết hạn trong 5 phút
      if (timeUntilExpiration > 0 && timeUntilExpiration < 5 * 60 * 1000) {
        console.warn('Token sẽ hết hạn trong 5 phút');
        // TODO: Implement token refresh here
      }
      
      // ✅ Token đã hết hạn
      if (timeUntilExpiration <= 0) {
        if (isComponentMounted.current && state.isAuthenticated) {
          dispatch({ type: 'TOKEN_EXPIRED' });
        }
        
        if (tokenCheckInterval.current) {
          clearInterval(tokenCheckInterval.current);
          tokenCheckInterval.current = null;
        }
      }
    }, 60000); // Check every minute
  }, [state.isAuthenticated]);

  // 🔧 FIX 6: Start monitoring when authentication state changes
  useEffect(() => {
    if (state.isAuthenticated) {
      startTokenMonitoring();
    } else {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
        tokenCheckInterval.current = null;
      }
    }
  }, [state.isAuthenticated, startTokenMonitoring]);

  // Load user on first load
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // 🔧 FIX 7: Improved login with better error handling
  const login = async (loginData: LoginRequest) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const data = await authService.login(loginData);
      
      if (isComponentMounted.current) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
        
        // ✅ Start token monitoring after successful login
        setTimeout(() => {
          if (isComponentMounted.current) {
            startTokenMonitoring();
          }
        }, 100);
        
        // ✅ Better navigation handling
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/shop';
        navigate(redirectTo);
      }
    } catch (error: any) {
      if (!isComponentMounted.current) return;

      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      // ✅ Better error message handling
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Email hoặc mật khẩu không đúng.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
    }
  };

  // 🔧 FIX 8: Improved register
  const register = async (registerData: RegisterRequest) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const data = await authService.register(registerData);
      
      if (isComponentMounted.current) {
        dispatch({ type: 'REGISTER_SUCCESS', payload: data.user });
        
        // ✅ Start token monitoring after successful registration
        setTimeout(() => {
          if (isComponentMounted.current) {
            startTokenMonitoring();
          }
        }, 100);
        
        navigate('/shop');
      }
    } catch (error: any) {
      if (!isComponentMounted.current) return;

      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      // ✅ Better error message handling
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error?.message || 'Thông tin đăng ký không hợp lệ.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Email hoặc tên đăng nhập đã được sử dụng.';
      }
      
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
    }
  };

  // 🔧 FIX 9: Improved logout with cleanup
  const logout = async () => {
    try {
      // ✅ Stop token monitoring first
      cleanup();
      
      await authService.logout();
      
      if (isComponentMounted.current) {
        dispatch({ type: 'LOGOUT' });
        navigate('/auth');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // ✅ Still log out on client side even if server request fails
      if (isComponentMounted.current) {
        dispatch({ type: 'LOGOUT' });
        navigate('/auth');
      }
    }
  };

  // 🔧 FIX 10: Better error handling for updateUser
  const updateUser = async (userData: UpdateUserRequest) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const { user } = await authService.updateUserProfile(userData);
      
      if (isComponentMounted.current) {
        dispatch({ type: 'UPDATE_USER', payload: user });
      }
    } catch (error: any) {
      if (!isComponentMounted.current) return;

      let errorMessage = 'Cập nhật thông tin thất bại.';
      
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error?.message || 'Thông tin không hợp lệ.';
      } else if (error.response?.status === 401) {
        dispatch({ type: 'TOKEN_EXPIRED' });
        return;
      }
      
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // 🔧 FIX 11: Better error handling for updatePassword
  const updatePassword = async (passwordData: UpdatePasswordRequest) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const data = await authService.updatePassword(passwordData);
      
      if (isComponentMounted.current) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
        
        // ✅ Restart token monitoring with new token
        setTimeout(() => {
          if (isComponentMounted.current) {
            startTokenMonitoring();
          }
        }, 100);
      }
    } catch (error: any) {
      if (!isComponentMounted.current) return;

      let errorMessage = 'Cập nhật mật khẩu thất bại.';
      
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Mật khẩu hiện tại không đúng.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // 🔧 FIX 12: Manual user refresh
  const refreshUser = async () => {
    await loadUser(true, true);
  };

  // Existing methods with improved error handling
  const forgotPassword = async (email: string) => {
    try {
      const response = await authService.forgotPassword(email);
      return { success: true, message: response.message };
    } catch (error: any) {
      let errorMessage = 'Không thể gửi email đặt lại mật khẩu.';
      
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await authService.resetPassword(token, password);
      return { success: true, message: response.message };
    } catch (error: any) {
      let errorMessage = 'Đặt lại mật khẩu thất bại.';
      
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      const response = await authService.verifyEmail(token);
      if (state.user && isComponentMounted.current) {
        dispatch({ 
          type: 'UPDATE_USER', 
          payload: { ...state.user, isEmailVerified: true } 
        });
      }
      return { success: true, message: response.message };
    } catch (error: any) {
      let errorMessage = 'Xác thực email thất bại.';
      
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const resendVerification = async () => {
    try {
      const response = await authService.resendVerificationEmail();
      return { success: true, message: response.message };
    } catch (error: any) {
      let errorMessage = 'Gửi lại email xác thực thất bại.';
      
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      return { success: false, message: errorMessage };
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
        clearError,
        loadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};