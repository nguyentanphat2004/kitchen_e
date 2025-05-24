// src/features/auth/utils/api.utils.ts
import axios, { AxiosError } from 'axios';
import type { ApiError } from '../interfaces/auth-interfaces';

/**
 * Function to handle API errors
 * @param error - The error from axios request
 * @returns A formatted error message
 */
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    
    // Get error message from the response
    if (axiosError.response?.data?.error?.message) {
      return axiosError.response.data.error.message;
    }
    
    // Handle common HTTP status codes
    if (axiosError.response?.status) {
      switch (axiosError.response.status) {
        case 400:
          return 'Bad request: Please check your input.';
        case 401:
          return 'Unauthorized: Please log in again.';
        case 403:
          return 'Forbidden: You do not have permission to access this resource.';
        case 404:
          return 'Not found: The requested resource was not found.';
        case 500:
          return 'Server error: Something went wrong on our end.';
      }
    }
    
    // If no status code or other info, use the error message
    if (axiosError.message) {
      if (axiosError.message === 'Network Error') {
        return 'Network error: Please check your internet connection.';
      }
      return axiosError.message;
    }
  }
  
  // For non-axios errors
  if (error instanceof Error) {
    return error.message;
  }
  
  // Fallback
  return 'An unknown error occurred.';
};

/**
 * Function to check if server return a validation error
 * @param error - The error from axios request
 * @returns Boolean indicating if error is a validation error
 */
export const isValidationError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    return axiosError.response?.status === 400;
  }
  
  return false;
};

/**
 * Format validation errors from server
 * @param error - The error from axios request
 * @returns An object with field names and error messages
 */
export const formatValidationErrors = (error: unknown): Record<string, string> => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    if (axiosError.response?.data?.error?.details) {
      const details = axiosError.response.data.error.details;
      
      // Transform details to field-based errors
      const fieldErrors: Record<string, string> = {};
      
      // Handle different formats of validation errors
      if (Array.isArray(details)) {
        details.forEach((detail) => {
          if (detail.field && detail.message) {
            fieldErrors[detail.field] = detail.message;
          }
        });
      } else if (typeof details === 'object') {
        Object.keys(details).forEach((field) => {
          fieldErrors[field] = details[field];
        });
      }
      
      return fieldErrors;
    }
  }
  
  return {};
};
