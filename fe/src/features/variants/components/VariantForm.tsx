import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Switch, Card, Row, Col } from 'antd';
import ImageUpload from '../../../components/shared/ImageUpload';
import FormActions from '../../../components/shared/FormActions';
import type { ProductVariant, VariantFormData } from '../interfaces/interface';

interface VariantFormProps {
  variant?: ProductVariant;
  onSubmit: (data: VariantFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const VariantForm: React.FC<VariantFormProps> = ({
  variant,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const isEditMode = !!variant;

  useEffect(() => {
    if (variant) {
      form.setFieldsValue({
        name: variant.name,
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        material: variant.material,
        stockQuantity: variant.stockQuantity,
        priceAdjustment: variant.priceAdjustment,
        isActive: variant.isActive
      });

      if (variant.images) {
        setFileList(variant.images.map((image, index) => ({
          uid: `existing-${index}`,
          name: image.altText || `Image ${index + 1}`,
          status: 'done',
          url: image.url,
          existingImage: true
        })));
      }
    }
  }, [variant, form]);

  const handleSubmit = async (values: any) => {
    const formData: VariantFormData = {
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
        isActive: true,
        stockQuantity: 0,
        priceAdjustment: 0
      }}
    >
      <Row gutter={24}>
        <Col span={12}>
          <Card title="Basic Information" className="mb-6">
            <Form.Item
              name="name"
              label="Variant Name"
              rules={[{ required: true, message: 'Please enter variant name' }]}
            >
              <Input placeholder="Enter variant name" />
            </Form.Item>

            <Form.Item
              name="sku"
              label="SKU"
              rules={[{ required: true, message: 'Please enter SKU' }]}
            >
              <Input placeholder="Enter variant SKU" />
            </Form.Item>

            <Form.Item
              name="color"
              label="Color"
            >
              <Input placeholder="Enter color" />
            </Form.Item>

            <Form.Item
              name="size"
              label="Size"
            >
              <Input placeholder="Enter size" />
            </Form.Item>

            <Form.Item
              name="material"
              label="Material"
            >
              <Input placeholder="Enter material" />
            </Form.Item>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Pricing & Stock" className="mb-6">
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
              name="priceAdjustment"
              label="Price Adjustment (VND)"
              tooltip="Additional price adjustment for this variant (can be negative)"
            >
              <InputNumber
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                style={{ width: '100%' }}
                placeholder="Enter price adjustment"
              />
            </Form.Item>

            <Form.Item
              name="isActive"
              label="Active"
              valuePropName="checked"
              tooltip="Inactive variants won't be shown to customers"
            >
              <Switch />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <Card title="Variant Images" className="mb-6">
        <Form.Item
          name="images"
          label="Variant Images"
        >
          <ImageUpload
            value={fileList}
            onChange={handleImageChange}
            onRemove={handleImageRemove}
            maxCount={5}
            multiple
            folder="variants"
          />
        </Form.Item>
      </Card>

      <FormActions
        onCancel={onCancel}
        isLoading={isLoading}
        isEditMode={isEditMode}
        submitText={isEditMode ? 'Update Variant' : 'Create Variant'}
      />
    </Form>
  );
};

export default VariantForm;