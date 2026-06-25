import { useState } from 'react';
import { Form } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { categoryService } from '../service/categoryService';
import { urlUtils, uploadUtils } from '../../../config/api_cli.config';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import type { Category, CategoryFormData } from '../interface/interface';

export const useCategoryManagement = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading, error, refetch } = useQuery({
    queryKey: ['categories', { flat: false }],
    queryFn: () => categoryService.getCategories(),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : [];

  const saveMutation = useMutation({
    mutationFn: (formData: FormData) =>
      editingCategory
        ? categoryService.updateCategory(editingCategory._id, formData)
        : categoryService.createCategory(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
      closeModal();
    },
    onError: (error: any) => {
      let message = `Failed to ${editingCategory ? 'update' : 'create'} category`;
      if (error.response?.data?.message) message = error.response.data.message;
      else if (error.response?.status === 413) message = 'File too large. Please choose a smaller image.';
      else if (error.response?.status === 415) message = 'Unsupported file type.';
      else if (error.message) message = error.message;
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => categoryService.restoreCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category restored successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to restore category');
    }
  });

  const handleSubmit = async (values: CategoryFormData) => {
    try {
      setUploading(true);
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const validation = uploadUtils.validateFile(fileList[0].originFileObj as File, {
          maxSize: 10 * 1024 * 1024,
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        });
        if (!validation.isValid) {
          throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
        }
      }
      const file = fileList.length > 0 && fileList[0].originFileObj
        ? fileList[0].originFileObj as File
        : undefined;
      const formData = uploadUtils.createFormData(values, file, 'image');
      await saveMutation.mutateAsync(formData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit form');
    } finally {
      setUploading(false);
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue({
        name: category.name || '',
        description: category.description || '',
        parentId: category.parentId || undefined,
        displayOrder: category.displayOrder || 0,
        featured: category.featured || false,
        showInMenu: category.showInMenu !== false,
        showInHome: category.showInHome || false,
        isActive: category.isActive !== false,
        icon: category.icon || '',
        metaTitle: category.metaTitle || '',
        metaDescription: category.metaDescription || '',
        metaKeywords: category.metaKeywords || ''
      });
      if (category.image) {
        const imageUrl = urlUtils.getFullImageUrl(category.image);
        if (imageUrl) {
          setFileList([{ uid: '-1', name: 'Current Image', status: 'done', url: imageUrl, thumbUrl: imageUrl }]);
        }
      } else {
        setFileList([]);
      }
    } else {
      setEditingCategory(null);
      form.resetFields();
      setFileList([]);
    }
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    form.resetFields();
    setFileList([]);
    setPreviewVisible(false);
    setPreviewImage('');
    setPreviewTitle('');
    setUploading(false);
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as RcFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const beforeUpload = (file: RcFile) => {
    const validation = uploadUtils.validateFile(file, {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    });
    if (!validation.isValid) {
      validation.errors.forEach(err => toast.error(err));
      return false;
    }
    return false;
  };

  const handleFileChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList.slice(-1));
  };

  return {
    // state
    form,
    isModalVisible,
    editingCategory,
    fileList,
    showDeleted,
    setShowDeleted,
    previewVisible,
    setPreviewVisible,
    previewImage,
    previewTitle,
    uploading,
    // data
    categories,
    isLoading,
    error,
    refetch,
    queryClient,
    // mutations
    saveMutation,
    deleteMutation,
    restoreMutation,
    // handlers
    handleSubmit,
    openModal,
    closeModal,
    handlePreview,
    beforeUpload,
    handleFileChange,
  };
};
