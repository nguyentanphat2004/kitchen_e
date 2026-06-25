import React, { useState } from 'react';
import { Card, Input, InputNumber, Switch, Upload, Button, Image, message } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { CustomizationOption } from '../interface/interface';
import { uploadUtils, urlUtils } from '../../../config/api_cli.config';

interface CustomizationOptionFormProps {
  option: Partial<CustomizationOption> & { image?: File };
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const CustomizationOptionForm: React.FC<CustomizationOptionFormProps> = ({
  option,
  index,
  onUpdate,
  onRemove,
  canRemove
}) => {
  const [fileList, setFileList] = useState<any[]>([]);

  const handleImageChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList.slice(-1)); // Only keep one image
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      onUpdate(index, 'image', newFileList[0].originFileObj);
    } else {
      onUpdate(index, 'image', undefined);
    }
  };

  const beforeUpload = (file: File) => {
    const validation = uploadUtils.validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    });
    
    if (!validation.isValid) {
      validation.errors.forEach(error => message.error(error));
      return false;
    }
    
    return false; // Prevent auto upload
  };

  return (
    <Card
      title={`Option ${index + 1}`}
      extra={
        canRemove && (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onRemove(index)}
            size="small"
          >
            Remove
          </Button>
        )
      }
      className="mb-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Option Name *</label>
          <Input
            placeholder="e.g., Color"
            value={option.name || ''}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Option Value *</label>
          <Input
            placeholder="e.g., Red"
            value={option.value || ''}
            onChange={(e) => onUpdate(index, 'value', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Price Adjustment (VND)</label>
          <InputNumber
            min={0}
            placeholder="0"
            value={option.priceAdjustment || 0}
            onChange={(value) => onUpdate(index, 'priceAdjustment', value || 0)}
            style={{ width: '100%' }}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Default Option</label>
          <Switch
            checked={option.isDefault || false}
            onChange={(checked) => onUpdate(index, 'isDefault', checked)}
            checkedChildren="Default"
            unCheckedChildren="Default"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-2">Option Image</label>
        <Upload
          listType="picture"
          fileList={fileList}
          onChange={handleImageChange}
          beforeUpload={beforeUpload}
          maxCount={1}
          accept="image/*"
        >
          <Button icon={<UploadOutlined />}>Upload Image</Button>
        </Upload>
        <div className="text-xs text-gray-500 mt-1">
          Optional image for this option (max 5MB)
        </div>
      </div>

      {/* Show existing image if available */}
      {option.image && typeof option.image === 'string' && (
        <div className="mt-2">
          <Image
            src={urlUtils.getFullImageUrl(option.image) || urlUtils.getFallbackImageUrl()}
            alt={option.name}
            width={100}
            height={100}
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}
    </Card>
  );
};

export default CustomizationOptionForm;