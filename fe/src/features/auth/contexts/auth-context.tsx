// src/features/auth/contexts/AuthContext.tsx
import React, { createContext, useReducer, useEffect, useCallback } from 'react';
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
  | { type: 'SET_LOADING' };

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
        loading: false
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload
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

  // Load user on first load
  const loadUser = useCallback(async () => {
    try {
      if (authService.isAuthenticated()) {
        const { user } = await authService.getCurrentUser();
        dispatch({ type: 'USER_LOADED', payload: user });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: 'Not authenticated' });
      }
    } catch (error) {
      localStorage.removeItem('token');
      dispatch({ type: 'AUTH_ERROR', payload: 'Session expired. Please login again.' });
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Login user
  const login = async (loginData: LoginRequest) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const data = await authService.login(loginData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
      navigate('/shop');
    } catch (error: any) {
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: error.response?.data?.error?.message || 'Login failed. Please try again.' 
      });
    }
  };

  // Register user
  const register = async (registerData: RegisterRequest) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const data = await authService.register(registerData);
      dispatch({ type: 'REGISTER_SUCCESS', payload: data.user });
      navigate('/shop');
    } catch (error: any) {
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: error.response?.data?.error?.message || 'Registration failed. Please try again.' 
      });
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      // Still log out on client side even if server request fails
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      navigate('/auth');
    }
  };

  // Update user
  const updateUser = async (userData: UpdateUserRequest) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const { user } = await authService.updateUserProfile(userData);
      dispatch({ type: 'UPDATE_USER', payload: user });
      return;
    } catch (error: any) {
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: error.response?.data?.error?.message || 'Failed to update profile.' 
      });
      throw error;
    }
  };

  // Update password
  const updatePassword = async (passwordData: UpdatePasswordRequest) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const data = await authService.updatePassword(passwordData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
      return;
    } catch (error: any) {
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: error.response?.data?.error?.message || 'Failed to update password.' 
      });
      throw error;
    }
  };

  // Forgot password
  const forgotPassword = async (email: string) => {
    try {
      const response = await authService.forgotPassword(email);
      return { success: true, message: response.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error?.message || 'Failed to process forgot password request.' 
      };
    }
  };

  // Reset password
  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await authService.resetPassword(token, password);
      return { success: true, message: response.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error?.message || 'Failed to reset password.' 
      };
    }
  };

  // Verify email
  const verifyEmail = async (token: string) => {
    try {
      const response = await authService.verifyEmail(token);
      if (state.user) {
        // Update current user state if they are logged in
        dispatch({ 
          type: 'UPDATE_USER', 
          payload: { ...state.user, isEmailVerified: true } 
        });
      }
      return { success: true, message: response.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error?.message || 'Failed to verify email.' 
      };
    }
  };

  // Resend verification email
  const resendVerification = async () => {
    try {
      const response = await authService.resendVerificationEmail();
      return { success: true, message: response.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error?.message || 'Failed to resend verification email.' 
      };
    }
  };

  // Clear error
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
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
