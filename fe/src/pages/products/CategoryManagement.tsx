import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Upload,
  Image,
  Popconfirm,
  Tag,
  Tooltip,
  InputNumber,
  TreeSelect,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  EyeOutlined,
  UndoOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { api } from '../../services/api';
import { urlUtils } from '../../config/api.config';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';

const { confirm } = Modal;
const { TextArea } = Input;

interface Category {
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
  level?: number; // Add this for flattened categories
}

interface CategoryFormData {
  name: string;
  description?: string;
  parentId?: string;
  displayOrder?: number;
  featured?: boolean;
  showInMenu?: boolean;
  showInHome?: boolean;
  isActive?: boolean;
  icon?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  removeImage?: boolean;
}

// Error Boundary Component
class CategoryErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CategoryManagement Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          message="Error Loading Categories"
          description="There was an error loading the category management interface. Please refresh the page."
          type="error"
          showIcon
          action={
            <Button onClick={() => this.setState({ hasError: false })}>
              Try Again
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

const CategoryManagement: React.FC = () => {
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

  // Fetch categories with error handling
  const { data: categoriesData, isLoading, error } = useQuery({
    queryKey: ['categories', { flat: false, includeDeleted: showDeleted }],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          flat: 'false',
          includeProducts: 'true'
        });
        
        const response = await api.get(`/categories?${params}`);
        console.log('Categories API response:', response.data);
        return response.data?.data || response.data;
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000
  });

  // Safe data extraction with defaults
  const categories = React.useMemo(() => {
    try {
      const cats = categoriesData?.categories || [];
      return Array.isArray(cats) ? cats : [];
    } catch (error) {
      console.error('Error processing categories data:', error);
      return [];
    }
  }, [categoriesData]);

  // Create/Update category mutation
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log('Submitting form data...');
      
      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingCategory) {
        return api.put(`/categories/${editingCategory._id}`, formData, config);
      } else {
        return api.post('/categories', formData, config);
      }
    },
    onSuccess: (response) => {
      console.log('Category save success:', response.data);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
      handleModalClose();
    },
    onError: (error: any) => {
      console.error('Category save error:', error);
      const message = error.response?.data?.message || 
                    error.response?.data?.error || 
                    `Failed to ${editingCategory ? 'update' : 'create'} category`;
      toast.error(message);
    }
  });

  // Delete and restore mutations
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => api.delete(`/categories/${categoryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  });

  const restoreMutation = useMutation({
    mutationFn: async (categoryId: string) => api.put(`/categories/${categoryId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category restored successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to restore category');
    }
  });

  // Handle form submission
  const handleSubmit = async (values: CategoryFormData) => {
    try {
      setUploading(true);
      const formData = new FormData();
      
      // Add form fields to FormData
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'boolean' ? value.toString() : String(value));
        }
      });
      
      // Add image file if exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj);
        console.log('Adding image file:', {
          name: fileList[0].name,
          size: fileList[0].size,
          type: fileList[0].type
        });
      }
      
      await mutation.mutateAsync(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Modal handlers
  const handleModalOpen = (category?: Category) => {
    try {
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
        
        // Set image preview if exists
        if (category.image) {
          setFileList([{
            uid: '-1',
            name: 'Current Image',
            status: 'done',
            url: category.image,
            thumbUrl: category.image
          }]);
        } else {
          setFileList([]);
        }
      } else {
        setEditingCategory(null);
        form.resetFields();
        setFileList([]);
      }
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error opening modal:', error);
      toast.error('Failed to open category form');
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    form.resetFields();
    setFileList([]);
    setPreviewVisible(false);
    setPreviewImage('');
    setPreviewTitle('');
    setUploading(false);
  };

  // File upload handlers
  const handlePreview = async (file: UploadFile) => {
    try {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj as RcFile);
      }

      setPreviewImage(file.url || (file.preview as string));
      setPreviewVisible(true);
      setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
    } catch (error) {
      console.error('Error previewing file:', error);
      toast.error('Failed to preview image');
    }
  };

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      toast.error('You can only upload image files!');
      return false;
    }
    
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      toast.error('Image must smaller than 10MB!');
      return false;
    }
    
    return false; // Prevent auto upload
  };

  const handleChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList.slice(-1)); // Only keep the last uploaded file
  };

  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>
        {uploading ? 'Uploading' : 'Upload'}
      </div>
    </div>
  );

  // Safe tree building functions
  const buildTreeSelectData = (categories: Category[], excludeId?: string): any[] => {
    try {
      if (!Array.isArray(categories)) return [];
      
      const validCategories = categories.filter(cat => 
        cat && 
        !cat.isDeleted && 
        cat._id !== excludeId && 
        cat.isActive
      );
      
      const categoryMap = new Map();
      const treeData: any[] = [];

      validCategories.forEach(category => {
        if (category?._id && category?.name) {
          categoryMap.set(category._id, {
            title: category.name,
            value: category._id,
            children: []
          });
        }
      });

      validCategories.forEach(category => {
        if (category?._id) {
          const node = categoryMap.get(category._id);
          if (node && category.parentId && categoryMap.has(category.parentId)) {
            const parent = categoryMap.get(category.parentId);
            if (parent) {
              parent.children.push(node);
            }
          } else if (node) {
            treeData.push(node);
          }
        }
      });

      return treeData;
    } catch (error) {
      console.error('Error building tree select data:', error);
      return [];
    }
  };

  const buildCategoryTree = (categories: Category[]): Category[] => {
    try {
      if (!Array.isArray(categories)) return [];
      
      const map = new Map<string, Category & { subcategories: Category[] }>();
      const roots: (Category & { subcategories: Category[] })[] = [];

      categories.forEach(cat => {
        if (cat?._id) {
          map.set(cat._id, { ...cat, subcategories: cat.subcategories || [] });
        }
      });

      if (categories.length > 0 && categories[0]?.subcategories !== undefined) {
        return categories;
      }

      map.forEach(cat => {
        if (cat.parentId && map.has(cat.parentId)) {
          const parent = map.get(cat.parentId)!;
          if (!parent.subcategories.find(sub => sub._id === cat._id)) {
            parent.subcategories.push(cat);
          }
        } else {
          roots.push(cat);
        }
      });

      return roots;
    } catch (error) {
      console.error('Error building category tree:', error);
      return [];
    }
  };

  const flattenCategories = (cats: Category[], level = 0): (Category & { level: number })[] => {
    try {
      if (!Array.isArray(cats)) return [];
      
      let result: (Category & { level: number })[] = [];
      
      const sortedCats = [...cats].sort((a, b) => {
        const orderA = a?.displayOrder || 0;
        const orderB = b?.displayOrder || 0;
        
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a?.name || '').localeCompare(b?.name || '');
      });
      
      sortedCats.forEach(cat => {
        if (cat?._id) {
          result.push({ ...cat, level });
          
          if (cat.subcategories && Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
            result = result.concat(flattenCategories(cat.subcategories, level + 1));
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error flattening categories:', error);
      return [];
    }
  };

  // Safe data processing
  const processedData = React.useMemo(() => {
    try {
      const treeCategories = buildCategoryTree(categories);
      const flatCategories = flattenCategories(treeCategories);
      const filteredCategories = showDeleted 
        ? flatCategories 
        : flatCategories.filter(cat => !cat?.isDeleted);
      
      return {
        treeCategories,
        flatCategories,
        filteredCategories
      };
    } catch (error) {
      console.error('Error processing category data:', error);
      return {
        treeCategories: [],
        flatCategories: [],
        filteredCategories: []
      };
    }
  }, [categories, showDeleted]);

  // Safe image URL getter using config utilities
  const getImageUrl = (category: Category): string | null => {
    try {
      if (!category?.image) return null;
      return urlUtils.getFullImageUrl(category.image);
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  };

  // Safe table columns with error boundaries
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text: string, record: Category & { level: number }) => {
        try {
          const level = record?.level || 0;
          const name = text || record?.name || 'Unnamed Category';
          
          return (
            <div className="flex items-center">
              <span style={{ 
                paddingLeft: level * 20,
                color: level > 0 ? '#666' : '#000',
                fontSize: level > 0 ? '13px' : '14px'
              }}>
                {level > 0 && (
                  <span className="text-gray-400 mr-1">└─ </span>
                )}
                {name}
              </span>
              <Space className="ml-2">
                {record?.featured && <Tag color="gold" size="small">Featured</Tag>}
                {record?.isActive === false && <Tag color="red" size="small">Inactive</Tag>}
                {record?.isDeleted && <Tag color="gray" size="small">Deleted</Tag>}
              </Space>
            </div>
          );
        } catch (error) {
          console.error('Error rendering name column:', error);
          return <span>{text || 'Error'}</span>;
        }
      }
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (_: any, record: Category) => {
        try {
          const imageUrl = getImageUrl(record);
          
          return imageUrl ? (
            <Image
              src={imageUrl}
              alt={record?.name || 'Category image'}
              width={60}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 6 }}
              placeholder={
                <div className="w-15 h-15 bg-gray-100 rounded flex items-center justify-center">
                  <LoadingOutlined />
                </div>
              }
              fallback={urlUtils.getFallbackImageUrl()}
              onError={(e) => {
                console.error('Image load error for category:', record?.name, 'URL:', imageUrl);
              }}
            />
          ) : (
            <div className="w-15 h-15 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          );
        } catch (error) {
          console.error('Error rendering image column:', error);
          return (
            <div className="w-15 h-15 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-400 text-xs">Error</span>
            </div>
          );
        }
      }
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      width: 150,
      render: (slug: string) => {
        try {
          return (
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {slug || 'No slug'}
            </code>
          );
        } catch (error) {
          console.error('Error rendering slug column:', error);
          return <span>{slug || 'Error'}</span>;
        }
      }
    },
    {
      title: 'Products',
      dataIndex: 'productsCount',
      key: 'productsCount',
      width: 80,
      align: 'center' as const,
      render: (count: number) => {
        try {
          return <Tag color="blue">{count || 0}</Tag>;
        } catch (error) {
          console.error('Error rendering products count:', error);
          return <Tag color="blue">0</Tag>;
        }
      }
    },
    {
      title: 'Order',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 80,
      align: 'center' as const,
      render: (order: number) => {
        try {
          return order || 0;
        } catch (error) {
          console.error('Error rendering display order:', error);
          return 0;
        }
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: any, record: Category) => {
        try {
          return (
            <Space direction="vertical" size="small">
              {record?.showInMenu && <Tag color="green" size="small">Menu</Tag>}
              {record?.showInHome && <Tag color="blue" size="small">Home</Tag>}
            </Space>
          );
        } catch (error) {
          console.error('Error rendering status column:', error);
          return <span>-</span>;
        }
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Category) => {
        try {
          if (!record?._id) return null;
          
          return (
            <Space size="small">
              <Tooltip title="Edit">
                <Button
                  size="small"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => handleModalOpen(record)}
                  disabled={record.isDeleted}
                />
              </Tooltip>
              
              {record.isDeleted ? (
                <Tooltip title="Restore">
                  <Button
                    size="small"
                    icon={<UndoOutlined />}
                    onClick={() => restoreMutation.mutate(record._id)}
                  />
                </Tooltip>
              ) : (
                <Popconfirm
                  title="Delete this category?"
                  description="This will soft delete the category."
                  onConfirm={() => deleteMutation.mutate(record._id)}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              )}
            </Space>
          );
        } catch (error) {
          console.error('Error rendering actions column:', error);
          return null;
        }
      }
    }
  ];

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Failed to Load Categories"
          description={error?.message || 'An error occurred while loading categories.'}
          type="error"
          showIcon
          action={
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <CategoryErrorBoundary>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Category Management</h1>
            <p className="text-gray-600 mt-1">Manage product categories and hierarchy</p>
          </div>
          
          <Space>
            <Switch
              checked={showDeleted}
              onChange={setShowDeleted}
              checkedChildren="Show Deleted"
              unCheckedChildren="Hide Deleted"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleModalOpen()}
            >
              Add Category
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={processedData.filteredCategories}
          loading={isLoading}
          rowKey={(record) => record?._id || Math.random().toString()}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} categories`
          }}
          scroll={{ x: 1200 }}
          size="small"
          locale={{
            emptyText: isLoading ? 'Loading...' : 'No categories found'
          }}
        />

        <Modal
          title={editingCategory ? 'Edit Category' : 'Add New Category'}
          open={isModalVisible}
          onCancel={handleModalClose}
          footer={null}
          width={800}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              displayOrder: 0,
              featured: false,
              showInMenu: true,
              showInHome: false,
              isActive: true
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="name"
                label="Category Name"
                rules={[
                  { required: true, message: 'Please enter category name' },
                  { max: 50, message: 'Name cannot exceed 50 characters' }
                ]}
              >
                <Input placeholder="Enter category name" maxLength={50} />
              </Form.Item>

              <Form.Item
                name="parentId"
                label="Parent Category"
              >
                <TreeSelect
                  treeData={buildTreeSelectData(processedData.treeCategories, editingCategory?._id)}
                  placeholder="Select parent category"
                  allowClear
                  treeDefaultExpandAll
                  showSearch
                  treeNodeFilterProp="title"
                />
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea 
                rows={3} 
                placeholder="Enter category description"
                maxLength={500}
                showCount
              />
            </Form.Item>

            <div className="grid grid-cols-3 gap-4">
              <Form.Item
                name="displayOrder"
                label="Display Order"
              >
                <InputNumber 
                  min={0} 
                  placeholder="0"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="icon"
                label="Icon Class"
              >
                <Input placeholder="e.g., fas fa-home" />
              </Form.Item>

              <div className="space-y-2">
                <Form.Item name="featured" valuePropName="checked">
                  <Switch checkedChildren="Featured" unCheckedChildren="Featured" />
                </Form.Item>
                <Form.Item name="showInMenu" valuePropName="checked">
                  <Switch checkedChildren="Show in Menu" unCheckedChildren="Show in Menu" />
                </Form.Item>
                <Form.Item name="showInHome" valuePropName="checked">
                  <Switch checkedChildren="Show on Home" unCheckedChildren="Show on Home" />
                </Form.Item>
                <Form.Item name="isActive" valuePropName="checked">
                  <Switch checkedChildren="Active" unCheckedChildren="Active" />
                </Form.Item>
              </div>
            </div>

            <Form.Item label="Category Image">
              <Upload
                name="image"
                listType="picture-card"
                fileList={fileList}
                onPreview={handlePreview}
                onChange={handleChange}
                beforeUpload={beforeUpload}
                accept="image/*"
                maxCount={1}
              >
                {fileList.length >= 1 ? null : uploadButton}
              </Upload>
              <div className="mt-2 text-xs text-gray-500">
                Supported: JPG, PNG, GIF, WebP. Max size: 10MB
              </div>
              
              {editingCategory?.image && fileList.length === 0 && (
                <div className="mt-3">
                  <Form.Item name="removeImage" valuePropName="checked" className="mb-0">
                    <Switch 
                      checkedChildren="Remove current image" 
                      unCheckedChildren="Keep current image" 
                      size="small"
                    />
                  </Form.Item>
                </div>
              )}
            </Form.Item>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">SEO Settings</h4>
              
              <Form.Item
                name="metaTitle"
                label="Meta Title"
              >
                <Input placeholder="SEO title for this category" maxLength={60} />
              </Form.Item>

              <Form.Item
                name="metaDescription"
                label="Meta Description"
              >
                <TextArea
                  rows={2}
                  placeholder="SEO description for this category"
                  maxLength={160}
                  showCount
                />
              </Form.Item>

              <Form.Item
                name="metaKeywords"
                label="Meta Keywords"
              >
                <Input placeholder="Comma-separated keywords" />
              </Form.Item>
            </div>

            <Form.Item className="mb-0 text-right">
              <Space>
                <Button onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={mutation.isPending || uploading}
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Image Preview Modal */}
        <Modal
          open={previewVisible}
          title={previewTitle}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
        >
          <img alt="example" style={{ width: '100%' }} src={previewImage} />
        </Modal>
      </div>
    </CategoryErrorBoundary>
  );
};

export default CategoryManagement;