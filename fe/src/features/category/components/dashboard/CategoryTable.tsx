import React from 'react';
import { Table, Button, Space, Image, Tag, Tooltip, Popconfirm } from 'antd';
import {
  EditOutlined, DeleteOutlined, UndoOutlined, LoadingOutlined
} from '@ant-design/icons';
import { urlUtils } from '../../../../config/api_cli.config';
import type { Category } from '../../interface/interface';

interface CategoryTableProps {
  data: (Category & { level: number })[];
  isLoading: boolean;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  isDeleting: boolean;
  isRestoring: boolean;
}

const CategoryTable: React.FC<CategoryTableProps> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onRestore,
  isDeleting,
  isRestoring,
}) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text: string, record: Category & { level: number }) => {
        const level = record?.level || 0;
        return (
          <div className="flex items-center">
            <span style={{
              paddingLeft: level * 20,
              color: level > 0 ? '#666' : '#000',
              fontSize: level > 0 ? '13px' : '14px'
            }}>
              {level > 0 && <span className="text-gray-400 mr-1">└─ </span>}
              {text || 'Unnamed Category'}
            </span>
            <Space className="ml-2">
              {record?.featured && <Tag color="gold">Featured</Tag>}
              {record?.isActive === false && <Tag color="red">Inactive</Tag>}
              {record?.isDeleted && <Tag color="gray">Deleted</Tag>}
            </Space>
          </div>
        );
      }
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (_: any, record: Category) => {
        const imageUrl = record?.image ? urlUtils.getFullImageUrl(record.image) : null;
        return imageUrl ? (
          <Image
            src={imageUrl}
            alt={record?.name || 'Category image'}
            width={60}
            height={60}
            style={{ objectFit: 'cover', borderRadius: 6 }}
            placeholder={<div className="w-15 h-15 bg-gray-100 rounded flex items-center justify-center"><LoadingOutlined /></div>}
            fallback={urlUtils.getFallbackImageUrl()}
          />
        ) : (
          <div className="w-15 h-15 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        );
      }
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      width: 150,
      render: (slug: string) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{slug || 'No slug'}</code>
      )
    },
    {
      title: 'Products',
      dataIndex: 'productsCount',
      key: 'productsCount',
      width: 80,
      align: 'center' as const,
      render: (count: number) => <Tag color="blue">{count || 0}</Tag>
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
      key: 'status',
      width: 120,
      render: (_: any, record: Category) => (
        <Space direction="vertical" size="small">
          {record?.showInMenu && <Tag color="green">Menu</Tag>}
          {record?.showInHome && <Tag color="blue">Home</Tag>}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Category) => {
        if (!record?._id) return null;
        return (
          <Space size="small">
            <Tooltip title="Edit">
              <Button
                size="small"
                type="primary"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                disabled={record.isDeleted}
              />
            </Tooltip>
            {record.isDeleted ? (
              <Tooltip title="Restore">
                <Button
                  size="small"
                  icon={<UndoOutlined />}
                  onClick={() => onRestore(record._id)}
                  loading={isRestoring}
                />
              </Tooltip>
            ) : (
              <Popconfirm
                title="Delete this category?"
                description="This will soft delete the category."
                onConfirm={() => onDelete(record._id)}
                okText="Delete"
                cancelText="Cancel"
              >
                <Button size="small" danger icon={<DeleteOutlined />} loading={isDeleting} />
              </Popconfirm>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={isLoading}
      rowKey={(record) => record?._id || Math.random().toString()}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} categories`,
        position: ['bottomCenter']
      }}
      scroll={{ x: 1200 }}
      size="small"
      locale={{ emptyText: isLoading ? 'Loading...' : 'No categories found' }}
    />
  );
};

export default CategoryTable;
