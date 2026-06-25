import { api, endpoints } from '../../../config/api_cli.config';
import type { VariantFormData } from '../interfaces/interface';

export const variantService = {
  // Get variants for a product
  async getProductVariants(productId: string) {
    const response = await api.get(endpoints.products.variants(productId));
    return response.data;
  },

  // Get single variant
  async getProductVariant(productId: string, variantId: string) {
    const response = await api.get(endpoints.products.variantById(productId, variantId));
    return response.data;
  },

  // Create variant
  async createProductVariant(productId: string, data: VariantFormData) {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'images' && key !== 'removeImages') {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
    });

    if (data.images) {
      data.images.forEach(file => {
        formData.append('images', file);
      });
    }

    const response = await api.post(endpoints.products.variants(productId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Update variant
  async updateProductVariant(productId: string, variantId: string, data: VariantFormData) {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'images' && key !== 'removeImages') {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
    });

    if (data.images) {
      data.images.forEach(file => {
        formData.append('images', file);
      });
    }

    if (data.removeImages && data.removeImages.length > 0) {
      formData.append('removeImages', JSON.stringify(data.removeImages));
    }

    const response = await api.put(endpoints.products.variantById(productId, variantId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Delete variant
  async deleteProductVariant(productId: string, variantId: string) {
    const response = await api.delete(endpoints.products.variantById(productId, variantId));
    return response.data;
  },

  // Restore variant
  async restoreProductVariant(productId: string, variantId: string) {
    const response = await api.put(endpoints.products.restoreVariant(productId, variantId));
    return response.data;
  }
};