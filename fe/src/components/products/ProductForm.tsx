import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Switch, Card, Row, Col, Select } from 'antd';
import type { Product, ProductFormData } from '../../services/productService';
import ImageUpload from '../shared/ImageUpload';
import FormActions from '../shared/FormActions';
import CategorySelect from './CategorySelect'; // Import CategorySelect

const { TextArea } = Input;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const isEditMode = !!product;

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
        weight: product.weight,
        dimensions: product.dimensions ? JSON.stringify(product.dimensions) : undefined
      });

      // Set existing images
      if (product.images) {
        setFileList(product.images.map((image, index) => ({
          uid: `existing-${index}`,
          name: image.altText || `Image ${index + 1}`,
          status: 'done',
          url: image.url,
          existingImage: true
        })));
      }
    }
  }, [product, form]);

  const handleSubmit = async (values: any) => {
    const formData: ProductFormData = {
      ...values,
      images: fileList
        .filter(file => file.originFileObj)
        .map(file => file.originFileObj),
      removeImages: removedImages
    };

    await onSubmit(formData);
  };

  const handleImageChange = (newFileList: any[]) => {
    setFileList(newFileList);
  };

  const handleImageRemove = (file: any) => {
    if (file.existingImage && file.url) {
      setRemovedImages([...removedImages, file.url]);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        isCustomizable: false,
        featured: false,
        stockQuantity: 0,
        tags: []
      }}
    >
      <Row gutter={24}>
        <Col span={12}>
          <Card title="Basic Information" className="mb-6">
            <Form.Item
              name="name"
              label="Product Name"
              rules={[{ required: true, message: 'Please enter product name' }]}
            >
              <Input placeholder="Enter product name" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter product description' }]}
            >
              <TextArea rows={4} placeholder="Enter product description" />
            </Form.Item>

            {/* UPDATED: Use CategorySelect instead of manual Select */}
            <Form.Item
              name="categoryId"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <CategorySelect
                placeholder="Select a category"
                treeSelect={true}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="sku"
              label="SKU"
              rules={[{ required: true, message: 'Please enter SKU' }]}
            >
              <Input placeholder="Enter product SKU" />
            </Form.Item>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Pricing & Stock" className="mb-6">
            <Form.Item
              name="basePrice"
              label="Base Price (VND)"
              rules={[{ required: true, message: 'Please enter base price' }]}
            >
              <InputNumber
                min={0}
                prefix="₫"
                style={{ width: '100%' }}
                placeholder="Enter base price"
              />
            </Form.Item>

            <Form.Item
              name="stockQuantity"
              label="Stock Quantity"
              rules={[{ required: true, message: 'Please enter stock quantity' }]}
            >
              <InputNumber 
                min={0} 
                style={{ width: '100%' }} 
                placeholder="Enter stock quantity"
              />
            </Form.Item>

            <Form.Item
              name="weight"
              label="Weight (kg)"
            >
              <InputNumber
                min={0}
                step={0.1}
                style={{ width: '100%' }}
                placeholder="Enter weight in kg"
              />
            </Form.Item>

            <Form.Item
              name="dimensions"
              label="Dimensions (JSON format)"
              tooltip="Enter dimensions in JSON format: {length: 10, width: 5, height: 2, unit: 'cm'}"
            >
              <TextArea 
                rows={3} 
                placeholder='{"length": 10, "width": 5, "height": 2, "unit": "cm"}'
              />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Card title="Product Images" className="mb-6">
            <Form.Item
              name="images"
              label="Product Images"
              rules={[{ 
                required: !isEditMode && fileList.length === 0, 
                message: 'Please upload at least one image' 
              }]}
            >
              <ImageUpload
                value={fileList}
                onChange={handleImageChange}
                onRemove={handleImageRemove}
                maxCount={10}
                multiple
                folder="products"
              />
            </Form.Item>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Additional Settings" className="mb-6">
            <Form.Item
              name="tags"
              label="Tags"
            >
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Enter tags (press Enter to add)"
                tokenSeparators={[',']}
              />
            </Form.Item>

            <Form.Item
              name="isCustomizable"
              label="Customizable Product"
              valuePropName="checked"
              tooltip="Allow customers to customize this product"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="featured"
              label="Featured Product"
              valuePropName="checked"
              tooltip="Show this product in featured section"
            >
              <Switch />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <FormActions
        onCancel={onCancel}
        isLoading={isLoading}
        isEditMode={isEditMode}
        submitText={isEditMode ? 'Update Product' : 'Create Product'}
      />
    </Form>
  );
};

export default ProductForm;