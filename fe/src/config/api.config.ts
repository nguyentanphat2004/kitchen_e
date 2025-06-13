import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const STORAGE_TYPE = import.meta.env.VITE_STORAGE_TYPE || 'local';

// AWS S3 Configuration (if using S3)
const AWS_BUCKET = import.meta.env.VITE_AWS_BUCKET || '';
const AWS_REGION = import.meta.env.VITE_AWS_REGION || '';

// Build API endpoint
const API_ENDPOINT = `${API_BASE_URL}/api`;

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: API_ENDPOINT,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        data: config.data,
        params: config.params
      });
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

/**
 * URL utilities for handling image and file URLs
 */
export const urlUtils = {
  /**
   * Get full image URL from a path or partial URL
   * @param imagePath - Image path or URL from backend
   * @returns Full image URL or null
   */
  getFullImageUrl(imagePath: string | null | undefined): string | null {
    try {
      if (!imagePath) {
        console.log('urlUtils: No image path provided');
        return null;
      }

      // If already a complete URL, return as is
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }

      if (STORAGE_TYPE === 's3') {
        // For S3 storage, construct S3 URL
        if (AWS_BUCKET && AWS_REGION) {
          // Clean the path (remove leading slashes)
          const cleanPath = imagePath.replace(/^\/+/, '');
          const s3Url = `https://${AWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${cleanPath}`;
          console.log('urlUtils: Generated S3 URL:', { path: imagePath, url: s3Url });
          return s3Url;
        } else {
          console.error('urlUtils: S3 configuration missing');
          return null;
        }
      } else {
        // For local storage, construct local URL
        let cleanPath = imagePath.replace(/^\/+/, '');
        
        // Ensure the path starts with uploads/ for local files
        if (!cleanPath.startsWith('uploads/')) {
          cleanPath = `uploads/${cleanPath}`;
        }
        
        const localUrl = `${API_BASE_URL}/${cleanPath}`;
        console.log('urlUtils: Generated local URL:', { path: imagePath, url: localUrl });
        return localUrl;
      }
    } catch (error) {
      console.error('urlUtils: Error generating image URL:', error);
      return null;
    }
  },

  /**
   * Get fallback image URL when image is not available
   * @returns Fallback image URL
   */
  getFallbackImageUrl(): string {
    return `${API_BASE_URL}/uploads/fallback/no-image.png`;
  },

  /**
   * Get thumbnail URL (placeholder for future implementation)
   * @param imagePath - Original image path
   * @param size - Thumbnail size
   * @returns Thumbnail URL (currently returns original)
   */
  getThumbnailUrl(imagePath: string | null | undefined, size: number = 150): string | null {
    // For now, return the full image URL
    // In the future, this could generate actual thumbnail URLs
    return this.getFullImageUrl(imagePath);
  },

  /**
   * Validate if an image URL is accessible
   * @param imageUrl - Image URL to validate
   * @returns Promise<boolean>
   */
  async validateImageUrl(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('urlUtils: Image validation failed:', error);
      return false;
    }
  },

  /**
   * Preload an image to check if it's accessible
   * @param imageUrl - Image URL to preload
   * @returns Promise<boolean>
   */
  preloadImage(imageUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  }
};

/**
 * File upload utilities
 */
export const uploadUtils = {
  /**
   * Validate file before upload
   * @param file - File to validate
   * @param options - Validation options
   * @returns Validation result
   */
  validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    const allowedTypes = options.allowedTypes || [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Convert file to base64
   * @param file - File to convert
   * @returns Promise<string>
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  },

  /**
   * Create FormData for file upload
   * @param data - Data object
   * @param files - Files to upload
   * @param fileFieldName - Field name for files
   * @returns FormData
   */
  createFormData(
    data: Record<string, any>, 
    files?: File | File[], 
    fileFieldName: string = 'images'
  ): FormData {
    const formData = new FormData();

    // Add data fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'boolean' ? value.toString() : String(value));
      }
    });

    // Add files
    if (files) {
      if (Array.isArray(files)) {
        files.forEach((file) => {
          formData.append(fileFieldName, file);
        });
      } else {
        formData.append(fileFieldName, files);
      }
    }

    return formData;
  }
};

/**
 * API endpoints configuration
 */
export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    profile: '/auth/profile'
  },

  // Categories
  categories: {
    base: '/categories',
    featured: '/categories/featured',
    byId: (id: string) => `/categories/${id}`,
    products: (id: string) => `/categories/${id}/products`,
    restore: (id: string) => `/categories/${id}/restore`,
    reorder: '/categories/reorder'
  },

  // Products
  products: {
    base: '/products',
    featured: '/products/featured',
    bestSelling: '/products/best-selling',
    search: '/products/search',
    byId: (id: string) => `/products/${id}`,
    restore: (id: string) => `/products/${id}/restore`,
    
    // Variants
    variants: (productId: string) => `/products/${productId}/variants`,
    variantById: (productId: string, variantId: string) => `/products/${productId}/variants/${variantId}`,
    restoreVariant: (productId: string, variantId: string) => `/products/${productId}/variants/${variantId}/restore`,
    
    // Reviews
    reviews: (productId: string) => `/products/${productId}/reviews`,
    reviewById: (productId: string, reviewId: string) => `/products/${productId}/reviews/${reviewId}`
  },

  // Users
  users: {
    base: '/users',
    byId: (id: string) => `/users/${id}`,
    profile: '/users/profile'
  }
};

// Export configuration
export const config = {
  API_BASE_URL,
  API_ENDPOINT,
  API_VERSION,
  STORAGE_TYPE,
  AWS_BUCKET,
  AWS_REGION
};

export default api;