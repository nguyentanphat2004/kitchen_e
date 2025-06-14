import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import  { variantService, type VariantFormData } from '../services/variantService';

export const useProductVariants = (productId: string) => {
  return useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => variantService.getProductVariants(productId),
    enabled: !!productId
  });
};

export const useProductVariant = (productId: string, variantId: string) => {
  return useQuery({
    queryKey: ['product-variant', productId, variantId],
    queryFn: () => variantService.getProductVariant(productId, variantId),
    enabled: !!productId && !!variantId
  });
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: VariantFormData }) =>
      variantService.createProductVariant(productId, data),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      message.success('Variant created successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create variant');
    }
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, variantId, data }: { 
      productId: string; 
      variantId: string; 
      data: VariantFormData 
    }) => variantService.updateProductVariant(productId, variantId, data),
    onSuccess: (_, { productId, variantId }) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-variant', productId, variantId] });
      message.success('Variant updated successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update variant');
    }
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) =>
      variantService.deleteProductVariant(productId, variantId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      message.success('Variant deleted successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete variant');
    }
  });
};