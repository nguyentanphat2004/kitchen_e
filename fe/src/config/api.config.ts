// src/config/api.config.ts

interface ApiConfig {
    baseURL: string;
    timeout: number;
    imageBaseURL: string;
  }
  
  // Get API base URL based on environment
  const getApiBaseURL = (): string => {
    // Try environment variable first (with proper React env var naming)
    const envApiUrl = import.meta?.env?.VITE_API_URL || 
                     (window as any).__ENV__?.REACT_APP_API_URL ||
                     process.env?.REACT_APP_API_URL;
    
    if (envApiUrl) {
      return envApiUrl;
    }
  
    // Fallback based on current location
    if (typeof window !== 'undefined' && window.location) {
      const { protocol, hostname, port } = window.location;
      
      // Development environments
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Common development API ports
        const devPorts = ['5000', '3001', '8000', '8080'];
        const currentPort = port || '3000';
        
        // If current port is in dev range, try API on common ports
        if (currentPort === '3000' || currentPort === '3001') {
          return `${protocol}//${hostname}:5000`;
        }
        
        return `${protocol}//${hostname}:5000`;
      }
      
      // Production: assume API is on same domain
      return `${protocol}//${hostname}${port ? ':' + port : ''}`;
    }
    
    // Final fallback
    return 'http://localhost:5000';
  };
  
  // Configuration object
  export const apiConfig: ApiConfig = {
    baseURL: getApiBaseURL(),
    timeout: 30000, // 30 seconds
    imageBaseURL: getApiBaseURL()
  };
  
  // Utility functions for URL handling
  export const urlUtils = {
    /**
     * Clean image URL by removing undefined/null prefixes
     */
    cleanImageUrl: (url: string): string => {
      if (!url) return '';
      
      let cleanUrl = url;
      
      // Remove undefined/null prefixes
      if (cleanUrl.startsWith('undefined/')) {
        cleanUrl = cleanUrl.replace('undefined/', '');
      }
      if (cleanUrl.startsWith('null/')) {
        cleanUrl = cleanUrl.replace('null/', '');
      }
      
      return cleanUrl;
    },
  
    /**
     * Get full image URL from relative path
     */
    getFullImageUrl: (imagePath: string): string | null => {
      if (!imagePath) return null;
      
      // If already a full URL, return as is
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }
      
      // Clean the image path
      const cleanPath = urlUtils.cleanImageUrl(imagePath);
      if (!cleanPath) return null;
      
      // Ensure path starts with /
      const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
      
      return `${apiConfig.imageBaseURL}${normalizedPath}`;
    },
  
    /**
     * Check if URL is accessible
     */
    isValidImageUrl: async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    },
  
    /**
     * Get fallback image URL
     */
    getFallbackImageUrl: (): string => {
      return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI2IDI4QzI3LjEwNDYgMjggMjggMjcuMTA0NiAyOCAyNkMyOCAyNC44OTU0IDI3LjEwNDYgMjQgMjYgMjRDMjQuODk1NCAyNCAyNCAyNC44OTU0IDI0IDI2QzI0IDI3LjEwNDYgMjQuODk1NCAyOCAyNiAyOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDM4TDI4IDMwTDMyIDM0TDQwIDI2TDQ0IDMwVjQ0SDIwVjM4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
    }
  };
  
  // Debug utilities
  export const debugUtils = {
    logApiConfig: () => {
      console.log('API Configuration:', {
        baseURL: apiConfig.baseURL,
        imageBaseURL: apiConfig.imageBaseURL,
        currentLocation: window.location?.href,
        userAgent: navigator?.userAgent
      });
    },
  
    testImageUrl: async (url: string) => {
      console.log('Testing image URL:', url);
      const isValid = await urlUtils.isValidImageUrl(url);
      console.log('Image URL valid:', isValid);
      return isValid;
    }
  };
  
  // Export for debugging in development
  if (typeof window !== 'undefined') {
    (window as any).__API_CONFIG__ = { apiConfig, urlUtils, debugUtils };
  }