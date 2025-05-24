// src/features/auth/interfaces/auth.interfaces.ts

// User interface based on your backend model
export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  role: 'customer' | 'staff' | 'admin';
  isEmailVerified: boolean;
}

// Authentication state interface
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Login request interface
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Login response interface
export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

// Register request interface
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Register response interface
export interface RegisterResponse {
  success: boolean;
  token: string;
  user: User;
}

// Update user request interface
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

// Update password request interface
export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Forgot password request interface
export interface ForgotPasswordRequest {
  email: string;
}

// Reset password request interface
export interface ResetPasswordRequest {
  password: string;
}

// Verification token response
export interface VerificationResponse {
  success: boolean;
  message: string;
}

// API Error response
export interface ApiError {
  success: boolean;
  error: {
    message: string;
    statusCode: number;
  };
}
