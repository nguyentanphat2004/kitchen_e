import React from 'react';
import { Table, Button, Space, Popconfirm, Tag, Image, Tooltip, Alert } from 'antd';
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
  // 🔧 FIX 1: Add debugging
  console.log('🔍 CustomizationList props:', {
    customizations,
    customizationsLength: customizations?.length,
    customizationsType: typeof customizations,
    loading,
    showActions
  });

  // 🔧 FIX 2: Ensure customizations is an array
  const safeCustomizations = Array.isArray(customizations) ? customizations : [];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Customization) => (
        <div>
          <div className="font-medium">{text || 'Unnamed'}</div>
          <div className="text-sm text-gray-500">
            Type: {record.customizationType || 'Unknown'}
          </div>
          {record.description && (
            <div className="text-xs text-gray-400 mt-1">
              {record.description}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'customizationType',
      key: 'customizationType',
      render: (type: string) => {
        const typeColors: Record<string, string> = {
          'color': 'blue',
          'size': 'green',
          'material': 'orange',
          'engraving': 'purple',
          'packaging': 'cyan',
          'other': 'default'
        };
        return <Tag color={typeColors[type] || 'default'}>{type || 'other'}</Tag>;
      }
    },
    {
      title: 'Options',
      dataIndex: 'options',
      key: 'options',
      render: (options: CustomizationOption[]) => {
        // 🔧 FIX 3: Handle null/undefined options
        if (!options || !Array.isArray(options) || options.length === 0) {
          return <span className="text-gray-400">No options</span>;
        }

        return (
          <div className="space-y-1">
            {options.slice(0, 3).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                {option.image && (
                  <Image
                    src={urlUtils.getFullImageUrl(option.image) || urlUtils.getFallbackImageUrl()}
                    alt={option.name || 'Option'}
                    width={20}
                    height={20}
                    style={{ objectFit: 'cover' }}
                    preview={false}
                    fallback={urlUtils.getFallbackImageUrl()}
                  />
                )}
                <span className="text-sm">
                  <strong>{option.name || 'Unknown'}:</strong> {option.value || 'N/A'}
                  {(option.priceAdjustment || 0) > 0 && (
                    <span className="text-green-600 ml-1">
                      (+{formatCurrency(option.priceAdjustment)})
                    </span>
                  )}
                  {option.isDefault && (
                    <Tag  color="orange" className="ml-1">Default</Tag>
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
        );
      }
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

  // 🔧 FIX 4: Show helpful message when no data
  const emptyText = () => {
    if (loading) {
      return 'Loading customizations...';
    }
    
    if (!Array.isArray(customizations)) {
      return (
        <div className="text-center py-4">
          <Alert
            message="Data Error"
            description="Customizations data is not in the expected format"
            type="error"
            showIcon
          />
        </div>
      );
    }
    
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">No customizations found</div>
        <div className="text-sm text-gray-400">
          Create customizations to provide product options for customers
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 🔧 FIX 5: Add debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-blue-50 rounded text-xs">
          <strong>Debug:</strong> {safeCustomizations.length} customizations, 
          Loading: {loading ? 'Yes' : 'No'}, 
          Type: {typeof customizations}
        </div>
      )}

      <Table
        columns={columns}
        dataSource={safeCustomizations}
        loading={loading}
        rowKey={(record) => record._id || Math.random().toString()}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} customizations`,
          hideOnSinglePage: true
        }}
        scroll={{ x: 1000 }}
        size="small"
        locale={{
          emptyText: emptyText()
        }}
        // 🔧 FIX 6: Add table props for better handling
        bordered
        className="customization-table"
      />
    </>
  );
};

export default CustomizationList;