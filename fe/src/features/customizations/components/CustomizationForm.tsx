import React, { useEffect, useState } from 'react';
import { Form, Input, Select, InputNumber, Switch, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { CustomizationOption, Customization, CustomizationFormData } from '../interface/interface';
import CustomizationOptionForm from './CustomizationOptionForm';
import FormActions from '../../../components/shared/FormActions';

const { TextArea } = Input;
const { Option } = Select;

interface CustomizationFormProps {
  customization?: Customization;
  onSubmit: (data: CustomizationFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type FormOption = Omit<CustomizationOption, 'image'> & {
  image?: string | File;
};

const CustomizationForm: React.FC<CustomizationFormProps> = ({
  customization,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState<FormOption[]>([
    { name: '', value: '', priceAdjustment: 0, isDefault: false }
  ]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const isEditMode = !!customization;

  useEffect(() => {
    if (customization) {
      form.setFieldsValue({
        name: customization.name,
        customizationType: customization.customizationType,
        description: customization.description,
        isRequired: customization.isRequired,
        displayOrder: customization.displayOrder,
        isActive: customization.isActive
      });

      // Set existing options
      if (customization.options && customization.options.length > 0) {
        setOptions(customization.options.map(opt => ({ ...opt })));
      }
    }
  }, [customization, form]);

  const handleSubmit = async (values: any) => {
    const formData: CustomizationFormData = {
      ...values,
      options: options.map(opt => ({
        name: opt.name || '',
        value: opt.value || '',
        priceAdjustment: opt.priceAdjustment || 0,
        isDefault: opt.isDefault || false,
        image: opt.image
      })),
      removeOptionImages: removedImages
    };

    await onSubmit(formData);
  };

  const addOption = () => {
    setOptions([...options, { name: '', value: '', priceAdjustment: 0, isDefault: false }]);
  };

  const updateOption = (index: number, field: string, value: any) => {
    const updatedOptions = [...options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    
    // If setting as default, unset others
    if (field === 'isDefault' && value === true) {
      updatedOptions.forEach((opt, i) => {
        if (i !== index) opt.isDefault = false;
      });
    }
    
    setOptions(updatedOptions);
  };

  const removeOption = (index: number) => {
    const optionToRemove = options[index];
    
    // If removing an existing option with image, add to removed images list
    if (optionToRemove.image && typeof optionToRemove.image === 'string') {
      setRemovedImages([...removedImages, optionToRemove.image]);
    }
    
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        isRequired: false,
        isActive: true,
        displayOrder: 0,
        customizationType: 'other'
      }}
    >
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Form.Item
            name="name"
            label="Customization Name"
            rules={[{ required: true, message: 'Please enter customization name' }]}
          >
            <Input placeholder="e.g., Color Selection" />
          </Form.Item>

          <Form.Item
            name="customizationType"
            label="Customization Type"
            rules={[{ required: true, message: 'Please select customization type' }]}
          >
            <Select placeholder="Select type">
              <Option value="color">Color</Option>
              <Option value="size">Size</Option>
              <Option value="material">Material</Option>
              <Option value="engraving">Engraving</Option>
              <Option value="packaging">Packaging</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Describe this customization option" />
          </Form.Item>
        </div>

        <div>
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

          <div className="space-y-4">
            <Form.Item name="isRequired" valuePropName="checked">
              <Switch 
                checkedChildren="Required" 
                unCheckedChildren="Optional" 
              />
            </Form.Item>

            <Form.Item name="isActive" valuePropName="checked">
              <Switch 
                checkedChildren="Active" 
                unCheckedChildren="Inactive" 
              />
            </Form.Item>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium">Customization Options</h4>
          <Button 
            type="dashed" 
            onClick={addOption} 
            icon={<PlusOutlined />}
          >
            Add Option
          </Button>
        </div>

        {options.map((option, index) => (
          <CustomizationOptionForm
            key={index}
            option={option as any}
            index={index}
            onUpdate={updateOption}
            onRemove={removeOption}
            canRemove={options.length > 1}
          />
        ))}

        {options.length === 0 && (
          <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded">
            <p>No options added yet.</p>
            <p className="text-sm">Click "Add Option" to create customization choices.</p>
          </div>
        )}
      </div>

      <FormActions
        onCancel={onCancel}
        isLoading={isLoading}
        isEditMode={isEditMode}
        submitText={isEditMode ? 'Update Customization' : 'Create Customization'}
      />
    </Form>
  );
};

export default CustomizationForm;