import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  Space,
  Card,
  Divider,
  Switch,
  message,
  Spin
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  SaveOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/format';

const { Option } = Select;
const { TextArea } = Input;

const AddProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.categories;
    }
  });

  // Fetch product data if in edit mode
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data.product;
    },
    enabled: isEditMode
  });

  // Create/Update product mutation
  const mutation = useMutation({
    mutationFn: async (values) => {
      const formData = new FormData();
      
      // Add basic fields
      Object.keys(values).forEach(key => {
        if (key !== 'images' && key !== 'tags') {
          formData.append(key, values[key]);
        }
      });

      // Add tags
      if (values.tags) {
        formData.append('tags', JSON.stringify(values.tags));
      }

      // Add new images
      fileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });

      // Add removed images
      if (removedImages.length > 0) {
        formData.append('removeImages', JSON.stringify(removedImages));
      }

      if (isEditMode) {
        return api.put(`/products/${id}`, formData);
      } else {
        return api.post('/products', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success(`Product ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate('/products');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
    }
  });

  // Set initial values when product data is loaded
  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId._id,
        basePrice: product.basePrice,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        isCustomizable: product.isCustomizable,
        featured: product.featured,
        tags: product.tags,
        dimensions: product.dimensions,
        weight: product.weight
      });

      // Set initial images
      if (product.images) {
        setFileList(product.images.map(image => ({
          uid: image.url,
          name: image.url.split('/').pop(),
          status: 'done',
          url: image.url
        })));
      }
    }
  }, [product, form]);

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Handle image upload
  const handleImageUpload = ({ file, fileList }) => {
    setFileList(fileList);
  };

  // Handle image removal
  const handleImageRemove = (file) => {
    if (file.url) {
      setRemovedImages([...removedImages, file.url]);
    }
    return true;
  };

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </h1>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/products')}
        >
          Back to Products
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          isCustomizable: false,
          featured: false,
          stockQuantity: 0
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Basic Information">
            <Form.Item
              name="name"
              label="Product Name"
              rules={[{ required: true, message: 'Please enter product name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter product description' }]}
            >
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="categoryId"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select>
                {categories?.map(category => (
                  <Option key={category._id} value={category._id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="sku"
              label="SKU"
              rules={[{ required: true, message: 'Please enter SKU' }]}
            >
              <Input />
            </Form.Item>
          </Card>

          <Card title="Pricing & Stock">
            <Form.Item
              name="basePrice"
              label="Base Price"
              rules={[{ required: true, message: 'Please enter base price' }]}
            >
              <InputNumber
                min={0}
                formatter={value => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/₫\s?|(,*)/g, '')}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="stockQuantity"
              label="Stock Quantity"
              rules={[{ required: true, message: 'Please enter stock quantity' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="isCustomizable"
              label="Customizable Product"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="featured"
              label="Featured Product"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Card>

          <Card title="Product Images">
            <Form.Item
              name="images"
              label="Product Images"
              rules={[{ required: !isEditMode, message: 'Please upload at least one image' }]}
            >
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={handleImageUpload}
                onRemove={handleImageRemove}
                beforeUpload={() => false}
                multiple
              >
                {fileList.length >= 8 ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Card>

          <Card title="Additional Information">
            <Form.Item
              name="tags"
              label="Tags"
            >
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Enter tags"
              />
            </Form.Item>

            <Form.Item
              name="dimensions"
              label="Dimensions (L x W x H)"
            >
              <Input placeholder="e.g., 10 x 5 x 2 cm" />
            </Form.Item>

            <Form.Item
              name="weight"
              label="Weight (kg)"
            >
              <InputNumber
                min={0}
                step={0.1}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Space>
            <Button onClick={() => navigate('/products')}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={mutation.isLoading}
            >
              {isEditMode ? 'Update Product' : 'Create Product'}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default AddProduct;
