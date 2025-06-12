import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Popconfirm,
  Tag,
  Image,
  Tooltip,
  Modal,
  Form,
  message
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RestoreOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { formatCurrency } from '../../utils/format';
import { api } from '../../services/api';

const { Option } = Select;

const ProductList = () => {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    category: undefined,
    inStock: undefined,
    featured: undefined
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isRestoreModalVisible, setIsRestoreModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const queryClient = useQueryClient();

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', pagination.current, pagination.pageSize, filters, sortField, sortOrder, searchText],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.current,
        limit: pagination.pageSize,
        sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
        ...filters,
        search: searchText
      });

      const response = await api.get(`/products?${params}`);
      return response.data;
    }
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  });

  // Restore product mutation
  const restoreMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/products/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setIsRestoreModalVisible(false);
      setSelectedProduct(null);
      toast.success('Product restored successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to restore product');
    }
  });

  // Handle table change
  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    setSortField(sorter.field || 'createdAt');
    setSortOrder(sorter.order === 'descend' ? 'desc' : 'asc');
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, current: 1 });
  };

  // Columns configuration
  const columns = [
    {
      title: 'Image',
      dataIndex: 'images',
      key: 'image',
      width: 100,
      render: (images) => (
        <Image
          src={images?.[0]?.url || '/placeholder.png'}
          alt="Product"
          width={50}
          height={50}
          style={{ objectFit: 'cover' }}
        />
      )
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text, record) => (
        <Link to={`/products/${record._id}/edit`}>{text}</Link>
      )
    },
    {
      title: 'Category',
      dataIndex: ['categoryId', 'name'],
      key: 'category',
      sorter: true
    },
    {
      title: 'Price',
      dataIndex: 'basePrice',
      key: 'price',
      sorter: true,
      render: (price) => formatCurrency(price)
    },
    {
      title: 'Stock',
      dataIndex: 'stockQuantity',
      key: 'stock',
      sorter: true,
      render: (stock) => (
        <Tag color={stock > 0 ? 'green' : 'red'}>
          {stock > 0 ? `${stock} in stock` : 'Out of stock'}
        </Tag>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space>
          {record.featured && (
            <Tag color="blue">Featured</Tag>
          )}
          {record.isCustomizable && (
            <Tag color="purple">Customizable</Tag>
          )}
          {record.isDeleted && (
            <Tag color="red">Deleted</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Link to={`/products/${record._id}/edit`}>
              <Button icon={<EditOutlined />} />
            </Link>
          </Tooltip>
          {!record.isDeleted ? (
            <Popconfirm
              title="Are you sure you want to delete this product?"
              onConfirm={() => deleteMutation.mutate(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          ) : (
            <Tooltip title="Restore">
              <Button
                icon={<RestoreOutlined />}
                onClick={() => {
                  setSelectedProduct(record);
                  setIsRestoreModalVisible(true);
                }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link to="/products/add">
          <Button type="primary" icon={<PlusOutlined />}>
            Add Product
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex gap-4">
        <Input
          placeholder="Search products..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Category"
          allowClear
          style={{ width: 200 }}
          onChange={(value) => handleFilterChange('category', value)}
        >
          {/* Add category options */}
        </Select>
        <Select
          placeholder="Stock Status"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => handleFilterChange('inStock', value)}
        >
          <Option value="true">In Stock</Option>
          <Option value="false">Out of Stock</Option>
        </Select>
        <Select
          placeholder="Featured"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => handleFilterChange('featured', value)}
        >
          <Option value="true">Featured</Option>
          <Option value="false">Not Featured</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={productsData?.products}
        rowKey="_id"
        loading={isLoading}
        pagination={{
          ...pagination,
          total: productsData?.pagination?.totalItems || 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`
        }}
        onChange={handleTableChange}
      />

      <Modal
        title="Restore Product"
        open={isRestoreModalVisible}
        onCancel={() => {
          setIsRestoreModalVisible(false);
          setSelectedProduct(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsRestoreModalVisible(false);
              setSelectedProduct(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="restore"
            type="primary"
            loading={restoreMutation.isLoading}
            onClick={() => restoreMutation.mutate(selectedProduct?._id)}
          >
            Restore
          </Button>
        ]}
      >
        <p>Are you sure you want to restore this product?</p>
        <p className="font-semibold">{selectedProduct?.name}</p>
      </Modal>
    </div>
  );
};

export default ProductList;
