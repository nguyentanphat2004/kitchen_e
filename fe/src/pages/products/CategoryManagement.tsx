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
  TreeSelect
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { api } from '../../services/api';
import type { UploadFile } from 'antd/es/upload/interface';

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

const CategoryManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch categories with hierarchy
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories', { flat: false, includeDeleted: showDeleted }],
    queryFn: async () => {
      const params = new URLSearchParams({
        flat: 'false',
        includeProducts: 'true',
        includeSubcategories: 'true'
      });
      
      if (showDeleted) {
        params.append('includeDeleted', 'true');
      }
      
      const response = await api.get(`/categories?${params}`);
      return response.data;
    }
  });

  const categories = categoriesData?.categories || [];

  // Create/Update category mutation
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (editingCategory) {
        return api.put(`/categories/${editingCategory._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        return api.post('/categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
      handleModalClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Failed to ${editingCategory ? 'update' : 'create'} category`);
    }
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return api.delete(`/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  });

  // Restore category mutation
  const restoreMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return api.put(`/categories/${categoryId}/restore`);
    },
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
      const formData = new FormData();
      
      // Add form fields
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      // Add image file if exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }
      
      await mutation.mutateAsync(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Handle category deletion
  const handleDelete = (category: Category) => {
    confirm({
      title: 'Are you sure you want to delete this category?',
      icon: <ExclamationCircleOutlined />,
      content: 'This will soft delete the category. You can restore it later.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        deleteMutation.mutate(category._id);
      }
    });
  };

  // Handle category restoration
  const handleRestore = (category: Category) => {
    confirm({
      title: 'Restore this category?',
      icon: <RestoreOutlined />,
      content: 'This will restore the deleted category.',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
        restoreMutation.mutate(category._id);
      }
    });
  };

  // Handle modal open/close
  const handleModalOpen = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue({
        name: category.name,
        description: category.description,
        parentId: category.parentId || undefined,
        displayOrder: category.displayOrder,
        featured: category.featured,
        showInMenu: category.showInMenu,
        showInHome: category.showInHome,
        isActive: category.isActive,
        icon: category.icon,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        metaKeywords: category.metaKeywords
      });
      
      // Set image preview if exists
      if (category.image) {
        setFileList([{
          uid: '-1',
          name: 'Current Image',
          status: 'done',
          url: category.image
        }]);
      }
    } else {
      setEditingCategory(null);
      form.resetFields();
      setFileList([]);
    }
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    form.resetFields();
    setFileList([]);
  };

  // Upload props
  const uploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList);
    },
    beforeUpload: () => false, // Prevent auto upload
    accept: 'image/*',
    maxCount: 1,
    listType: 'picture-card' as const,
  };

  // Build tree select data for parent categories
  const buildTreeSelectData = (categories: Category[]): any[] => {
    const categoryMap = new Map();
    const treeData: any[] = [];

    // Tạo map cho tất cả categories
    categories.forEach(category => {
      categoryMap.set(category._id, {
        title: category.name,
        value: category._id,
        children: []
      });
    });

    // Xây dựng cây
    categories.forEach(category => {
      const node = categoryMap.get(category._id);
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        treeData.push(node);
      }
    });

    return treeData;
  };

  // Flatten categories for table display
  const flattenCategories = (cats: Category[], level = 0): (Category & { level: number })[] => {
    let result: (Category & { level: number })[] = [];
    
    cats.forEach(cat => {
      result.push({ ...cat, level });
      if (cat.subcategories && cat.subcategories.length > 0) {
        result = result.concat(flattenCategories(cat.subcategories, level + 1));
      }
    });
    
    return result;
  };

  function buildCategoryTree(categories: Category[]): Category[] {
    const map = new Map<string, Category & { subcategories: Category[] }>();
    const roots: (Category & { subcategories: Category[] })[] = [];

    categories.forEach(cat => {
      map.set(cat._id, { ...cat, subcategories: [] });
    });

    map.forEach(cat => {
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.subcategories.push(cat);
      } else {
        roots.push(cat);
      }
    });

    return roots;
  }

  // Sử dụng:
  const treeCategories = buildCategoryTree(categories);
  const flatCategories = flattenCategories(treeCategories);

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Category & { level: number }) => (
        <div style={{ paddingLeft: record.level * 20 }}>
          <Space>
            {text}
            {record.featured && <Tag color="gold">Featured</Tag>}
            {!record.isActive && <Tag color="red">Inactive</Tag>}
            {record.isDeleted && <Tag color="gray">Deleted</Tag>}
          </Space>
        </div>
      )
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image: string) => (
        image ? (
          <Image
            src={image}
            alt="Category"
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )
      )
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug: string) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{slug}</code>
      )
    },
    {
      title: 'Products',
      dataIndex: 'productsCount',
      key: 'productsCount',
      width: 80,
      render: (count: number) => (
        <Tag color="blue">{count || 0}</Tag>
      )
    },
    {
      title: 'Order',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 80,
      render: (order: number) => order || 0
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: any, record: Category) => (
        <Space direction="vertical" size="small">
          {record.showInMenu && <Tag color="green" size="small">Menu</Tag>}
          {record.showInHome && <Tag color="blue" size="small">Home</Tag>}
        </Space>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (text: string) => new Date(text).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: Category) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleModalOpen(record)}
            />
          </Tooltip>
          
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
                icon={<RestoreOutlined />}
                onClick={() => handleRestore(record)}
              />
            </Tooltip>
          ) : (
            <Popconfirm
              title="Delete this category?"
              description="This will soft delete the category."
              onConfirm={() => handleDelete(record)}
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
      )
    }
  ];

  useEffect(() => {
    if (categoriesData) {
      console.log('Categories data:', categoriesData);
    }
  }, [categoriesData]);

  return (
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
        dataSource={flatCategories}
        loading={isLoading}
        rowKey="_id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} categories`
        }}
        scroll={{ x: 1200 }}
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
                treeData={buildTreeSelectData(treeCategories)}
                placeholder="Select parent category"
                allowClear
                treeDefaultExpandAll
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
            <Upload {...uploadProps}>
              {fileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload Image</div>
                </div>
              )}
            </Upload>
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
                loading={mutation.isPending}
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;