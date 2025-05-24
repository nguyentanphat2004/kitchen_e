// src/libs/http-client.ts
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create a custom axios instance
const httpClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Add a request interceptor to add Authorization header with token
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
httpClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  (error: AxiosError): Promise<AxiosError> => {
    // Get error status
    const status = error.response ? error.response.status : null;
    
    // Handle token expiry
    if (status === 401) {
      // Clear token from localStorage
      localStorage.removeItem('token');
      
      // Show toast message
      toast.error('Session expired. Please log in again.');
      
      // Redirect to login page
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
    }
    
    // Handle server errors
    if (status === 500) {
      toast.error('An unexpected error occurred. Please try again later.');
    }
    
    // Handle network errors
    if (!status) {
      toast.error('Network error. Please check your internet connection.');
    }
    
    return Promise.reject(error);
  }
);

export default httpClient;