import { api, endpoints } from '../config/api.config';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  image?: string;
  imagePath?: string;
  icon?: string;
  displayOrder: number;
  featured: boolean;
  showInMenu: boolean;
  showInHome: boolean;
  isActive: boolean;
  isDeleted: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: string;
  updatedAt: string;
  productsCount?: number;
  subcategories?: Category[];
  level?: number;
}

export const categoryService = {
  // Get categories for product management (active only, tree structure)
  async getCategoriesForProducts() {
    try {
      console.log('Fetching categories for products...');
      const params = new URLSearchParams({
        flat: 'false',
        includeProducts: 'false',
        activeOnly: 'true'
      });
      
      const response = await api.get(`${endpoints.categories.base}?${params}`);
      console.log('Categories API response:', response.data);
      
      // Handle different response structures
      const data = response.data?.data || response.data;
      const categories = data?.categories || data || [];
      
      if (!Array.isArray(categories)) {
        console.error('Categories data is not an array:', typeof categories);
        return [];
      }
      
      // Filter only active categories for product selection
      const activeCategories = categories.filter(cat => 
        cat && cat.isActive && !cat.isDeleted
      );
      
      console.log(`Processed ${activeCategories.length} active categories for products`);
      return activeCategories;
    } catch (error: any) {
      console.error('Failed to fetch categories for products:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  },

  // Get single category
  async getCategory(id: string) {
    try {
      const response = await api.get(endpoints.categories.byId(id));
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('Failed to fetch category:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch category');
    }
  }
};