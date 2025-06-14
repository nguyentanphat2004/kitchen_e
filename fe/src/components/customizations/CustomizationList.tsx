import React from 'react';
import { Table, Button, Space, Popconfirm, Tag, Image, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { Customization, CustomizationOption } from '../../types/customization.types';
import { formatCurrency } from '../../utils/format';
import { urlUtils } from '../../config/api.config';

interface CustomizationListProps {
  customizations: Customization[];
  loading?: boolean;
  onEdit?: (customization: Customization) => void;
  onDelete?: (id: string) => void;
  onView?: (customization: Customization) => void;
  showActions?: boolean;
}

const CustomizationList: React.FC<CustomizationListProps> = ({
  customizations,
  loading = false,
  onEdit,
  onDelete,
  onView,
  showActions = true
}) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Customization) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">{record.customizationType}</div>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'customizationType',
      key: 'customizationType',
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      )
    },
    {
      title: 'Options',
      dataIndex: 'options',
      key: 'options',
      render: (options: CustomizationOption[]) => (
        <div className="space-y-1">
          {options.slice(0, 3).map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              {option.image && (
                <Image
                  src={urlUtils.getFullImageUrl(option.image) || urlUtils.getFallbackImageUrl()}
                  alt={option.name}
                  width={20}
                  height={20}
                  style={{ objectFit: 'cover' }}
                  preview={false}
                />
              )}
              <span className="text-sm">
                {option.name}: {option.value}
                {option.priceAdjustment > 0 && (
                  <span className="text-green-600 ml-1">
                    (+{formatCurrency(option.priceAdjustment)})
                  </span>
                )}
                {option.isDefault && (
                  <Tag size="small" color="orange" className="ml-1">Default</Tag>
                )}
              </span>
            </div>
          ))}
          {options.length > 3 && (
            <div className="text-xs text-gray-500">
              +{options.length - 3} more options
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Required',
      dataIndex: 'isRequired',
      key: 'isRequired',
      width: 100,
      align: 'center' as const,
      render: (isRequired: boolean) => (
        <Tag color={isRequired ? 'red' : 'default'}>
          {isRequired ? 'Required' : 'Optional'}
        </Tag>
      )
    },
    {
      title: 'Order',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 80,
      align: 'center' as const,
      render: (order: number) => order || 0
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center' as const,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    }
  ];

  if (showActions) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Customization) => (
        <Space size="small">
          {onView && (
            <Tooltip title="View">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onView(record)}
              />
            </Tooltip>
          )}
          
          {onEdit && (
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          
          {onDelete && (
            <Popconfirm
              title="Delete this customization?"
              description="This action cannot be undone."
              onConfirm={() => onDelete(record._id)}
              okText="Delete"
              cancelText="Cancel"
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    } as any);
  }

  return (
    <Table
      columns={columns}
      dataSource={customizations}
      loading={loading}
      rowKey="_id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} customizations`
      }}
      scroll={{ x: 1000 }}
      size="small"
    />
  );
};

export default CustomizationList;