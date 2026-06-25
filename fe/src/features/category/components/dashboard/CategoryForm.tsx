import React from 'react';
import {
  Form, Input, InputNumber, Switch, Upload, TreeSelect,
  Button, Space,
  type FormInstance
} from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Category, CategoryFormData } from '../../interface/interface';
import { categoryUtils } from '../../hooks/useCategories';

const { TextArea } = Input;

interface CategoryFormProps {
  form: FormInstance<CategoryFormData>;
  editingCategory: Category | null;
  treeCategories: Category[];
  fileList: UploadFile[];
  uploading: boolean;
  isSubmitting: boolean;
  onFinish: (values: CategoryFormData) => void;
  onCancel: () => void;
  onPreview: (file: UploadFile) => void;
  onFileChange: (info: { fileList: UploadFile[] }) => void;
  beforeUpload: (file: any) => boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  form,
  editingCategory,
  treeCategories,
  fileList,
  uploading,
  isSubmitting,
  onFinish,
  onCancel,
  onPreview,
  onFileChange,
  beforeUpload,
}) => {
  const treeData = categoryUtils.buildTreeSelectData(treeCategories, editingCategory?._id);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
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
            { max: 50, message: 'Name cannot exceed 50 characters' },
            { min: 2, message: 'Name must be at least 2 characters' }
          ]}
        >
          <Input placeholder="Enter category name" maxLength={50} />
        </Form.Item>

        <Form.Item name="parentId" label="Parent Category">
          <TreeSelect
            treeData={treeData}
            placeholder="Select parent category"
            allowClear
            treeDefaultExpandAll
            showSearch
            treeNodeFilterProp="title"
          />
        </Form.Item>
      </div>

      <Form.Item name="description" label="Description">
        <TextArea rows={3} placeholder="Enter category description" maxLength={500} showCount />
      </Form.Item>

      <div className="grid grid-cols-3 gap-4">
        <Form.Item name="displayOrder" label="Display Order">
          <InputNumber min={0} max={999} placeholder="0" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="icon" label="Icon Class">
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
          onPreview={onPreview}
          onChange={onFileChange}
          beforeUpload={beforeUpload}
          accept="image/*"
          maxCount={1}
        >
          {fileList.length >= 1 ? null : (
            <div>
              {uploading ? <LoadingOutlined /> : <PlusOutlined />}
              <div style={{ marginTop: 8 }}>{uploading ? 'Uploading' : 'Upload'}</div>
            </div>
          )}
        </Upload>
        <div className="mt-2 text-xs text-gray-500">Supported: JPG, PNG, GIF, WebP. Max size: 10MB</div>

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
        <Form.Item name="metaTitle" label="Meta Title">
          <Input placeholder="SEO title for this category" maxLength={60} showCount />
        </Form.Item>
        <Form.Item name="metaDescription" label="Meta Description">
          <TextArea rows={2} placeholder="SEO description for this category" maxLength={160} showCount />
        </Form.Item>
        <Form.Item name="metaKeywords" label="Meta Keywords">
          <Input placeholder="Comma-separated keywords" />
        </Form.Item>
      </div>

      <Form.Item className="mb-0 text-right">
        <Space>
          <Button onClick={onCancel} disabled={uploading}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting || uploading}>
            {editingCategory ? 'Update Category' : 'Create Category'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default CategoryForm;
