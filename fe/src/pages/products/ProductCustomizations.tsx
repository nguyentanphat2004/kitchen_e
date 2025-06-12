import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
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
  InputNumber,
  Switch,
  Card,
  Typography,
  Popconfirm,
  message,
  Upload,
  Image
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { api } from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

interface CustomizationOption {
  name: string;
  value: string;
  priceAdjustment: number;
  image?: string;
  isDefault: boolean;
}

interface Customization {
  _id: string;
  name: string;
  customizationType: string;
  description: string;
  options: CustomizationOption[];
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
}

const ProductCustomizations: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomization, setEditingCustomization] = useState<Customization | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch customizations
  const { data: customizations, isLoading } = useQuery({
    queryKey: ['product-customizations', productId],
    queryFn: async () => {
      const response = await api.get(`/products/${productId}/customizations`);
      return response.data.customizations;
    }
  });

  // Create/Update customization mutation
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const formData = new FormData();
      
      // Add basic fields
      Object.keys(values).forEach(key => {
        if (key !== 'options' && key !== 'images') {
          formData.append(key, values[key]);
        }
      });

      // Add options as JSON string
      formData.append('options', JSON.stringify(values.options));

      // Add option images
      if (values.images) {
        values.images.forEach((file: any) => {
          if (file.originFileObj) {
            formData.append('images', file.originFileObj);
          }
        });
      }

      if (editingCustomization) {
        return api.put(`/products/${productId}/customizations/${editingCustomization._id}`, formData);
      }
      return api.post(`/products/${productId}/customizations`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-customizations', productId] });
      toast.success(`Customization ${editingCustomization ? 'updated' : 'created'} successfully`);
      handleModalClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Failed to ${editingCustomization ? 'update' : 'create'} customization`);
    }
  });

  // Delete customization mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${productId}/customizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-customizations', productId] });
      toast.success('Customization deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete customization');
    }
  });

  const handleModalOpen = (customization?: Customization) => {
    if (customization) {
      setEditingCustomization(customization);
      form.setFieldsValue({
        ...customization,
        options: customization.options.map(opt => ({
          ...opt,
          key: Math.random() // Add key for dynamic form
        }))
      });
    } else {
      setEditingCustomization(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingCustomization(null);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'customizationType',
      key: 'customizationType',
    },
    {
      title: 'Required',
      dataIndex: 'isRequired',
      key: 'isRequired',
      render: (isRequired: boolean) => (
        <span>{isRequired ? 'Yes' : 'No'}</span>
      ),
    },
    {
      title: 'Options',
      dataIndex: 'options',
      key: 'options',
      render: (options: CustomizationOption[]) => (
        <Space direction="vertical">
          {options.map((option, index) => (
            <div key={index}>
              {option.name}: {option.value}
              {option.priceAdjustment > 0 && ` (+${option.priceAdjustment})`}
            </div>
          ))}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span>{isActive ? 'Active' : 'Inactive'}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Customization) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleModalOpen(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this customization?"
            onConfirm={() => deleteMutation.mutate(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Product Customizations</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleModalOpen()}
        >
          Add Customization
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={customizations}
        loading={isLoading}
        rowKey="_id"
      />

      <Modal
        title={editingCustomization ? 'Edit Customization' : 'Add Customization'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isRequired: false,
            isActive: true,
            displayOrder: 0,
            options: [{ key: Math.random() }]
          }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter customization name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="customizationType"
            label="Type"
            rules={[{ required: true, message: 'Please select customization type' }]}
          >
            <Select>
              <Option value="select">Select</Option>
              <Option value="radio">Radio</Option>
              <Option value="checkbox">Checkbox</Option>
              <Option value="text">Text</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="isRequired"
            label="Required"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="Display Order"
          >
            <InputNumber min={0} />
          </Form.Item>

          <Form.List name="options">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    title={`Option ${index + 1}`}
                    extra={
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(field.name)}
                        disabled={fields.length === 1}
                      >
                        Delete
                      </Button>
                    }
                    className="mb-4"
                  >
                    <Form.Item
                      {...field}
                      name={[field.name, 'name']}
                      label="Name"
                      rules={[{ required: true, message: 'Please enter option name' }]}
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, 'value']}
                      label="Value"
                      rules={[{ required: true, message: 'Please enter option value' }]}
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, 'priceAdjustment']}
                      label="Price Adjustment"
                    >
                      <InputNumber
                        min={0}
                        formatter={value => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/₫\s?|(,*)/g, '')}
                      />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, 'isDefault']}
                      label="Default"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, 'image']}
                      label="Image"
                    >
                      <Upload
                        listType="picture"
                        maxCount={1}
                        beforeUpload={() => false}
                      >
                        <Button icon={<UploadOutlined />}>Upload Image</Button>
                      </Upload>
                    </Form.Item>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Option
                </Button>
              </>
            )}
          </Form.List>

          <div className="flex justify-end mt-6">
            <Space>
              <Button onClick={handleModalClose}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={mutation.isLoading}>
                {editingCustomization ? 'Update' : 'Create'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductCustomizations; 