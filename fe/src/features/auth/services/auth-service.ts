// src/features/auth/services/auth.service.ts
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

// Add request interceptor to add Authorization header with token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

class AuthService {
  /**
   * Login user
   * @param loginData Login credentials
   * @returns Promise with login response
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    const response = await axiosInstance.post<LoginResponse>('/login', loginData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  }

  /**
   * Register new user
   * @param registerData Registration data
   * @returns Promise with registration response
   */
  async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    const response = await axiosInstance.post<RegisterResponse>('/register', registerData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  }

  /**
   * Logout user
   * @returns Promise with void
   */
  async logout(): Promise<void> {
    await axiosInstance.get('/logout');
    localStorage.removeItem('token');
  }

  /**
   * Get current user details
   * @returns Promise with user data
   */
  async getCurrentUser(): Promise<{ user: User }> {
    const response = await axiosInstance.get<{ user: User }>('/me');
    return response.data;
  }

  /**
   * Update user profile
   * @param userData Updated user data
   * @returns Promise with updated user
   */
  async updateUserProfile(userData: UpdateUserRequest): Promise<{ user: User }> {
    const response = await axiosInstance.put<{ user: User }>('/me', userData);
    return response.data;
  }

  /**
   * Update user password
   * @param passwordData Current and new password
   * @returns Promise with token and user
   */
  async updatePassword(passwordData: UpdatePasswordRequest): Promise<LoginResponse> {
    const response = await axiosInstance.put<LoginResponse>('/password', passwordData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  }

  /**
   * Send forgot password email
   * @param email User email
   * @returns Promise with success message
   */
  async forgotPassword(email: string): Promise<VerificationResponse> {
    const response = await axiosInstance.post<VerificationResponse>('/forgot-password', { email });
    return response.data;
  }

  /**
   * Reset password using token
   * @param token Reset token
   * @param password New password
   * @returns Promise with success message
   */
  async resetPassword(token: string, password: string): Promise<VerificationResponse> {
    const response = await axiosInstance.post<VerificationResponse>(
      `/reset-password/${token}`,
      { password }
    );
    return response.data;
  }

  /**
   * Verify email with token
   * @param token Verification token
   * @returns Promise with verification response
   */
  async verifyEmail(token: string): Promise<VerificationResponse> {
    const response = await axiosInstance.get<VerificationResponse>(`/verify-email/${token}`);
    return response.data;
  }

  /**
   * Resend verification email
   * @returns Promise with verification response
   */
  async resendVerificationEmail(): Promise<VerificationResponse> {
    const response = await axiosInstance.post<VerificationResponse>('/resend-verification');
    return response.data;
  }

  /**
   * Check if user is authenticated
   * @returns Boolean indicating authentication status
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Get authentication token
   * @returns Token string or null
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}

// Export as singleton
export default new AuthService();
