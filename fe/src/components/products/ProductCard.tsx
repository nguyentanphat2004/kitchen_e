import React from 'react';
import { Card, Tag, Space, Button, Tooltip, Image } from 'antd';
import { EditOutlined, DeleteOutlined, RestOutlined, EyeOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../utils/format';
import { urlUtils } from '../../config/api.config';
import type { Product } from '../../services/productService';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onView?: (product: Product) => void;
  showActions?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onRestore,
  onView,
  showActions = true
}) => {
  const imageUrl = product.images?.[0]?.url 
    ? urlUtils.getFullImageUrl(product.images[0].url)
    : urlUtils.getFallbackImageUrl();

  const actions = [];
  
  if (showActions) {
    if (onView) {
      actions.push(
        <Tooltip title="View">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => onView(product)} 
          />
        </Tooltip>
      );
    }
    
    if (onEdit) {
      actions.push(
        <Tooltip title="Edit">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => onEdit(product)} 
          />
        </Tooltip>
      );
    }
    
    if (product.isDeleted && onRestore) {
      actions.push(
        <Tooltip title="Restore">
          <Button 
            type="text" 
            icon={<RestOutlined />} 
            onClick={() => onRestore(product._id)} 
          />
        </Tooltip>
      );
    } else if (!product.isDeleted && onDelete) {
      actions.push(
        <Tooltip title="Delete">
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => onDelete(product._id)} 
          />
        </Tooltip>
      );
    }
  }

  return (
    <Card
      hoverable
      cover={
        <div className="h-48 overflow-hidden">
          <Image
            alt={product.name}
            src={imageUrl || undefined}
            fallback={urlUtils.getFallbackImageUrl()}
            preview={false}
            className="w-full h-full object-cover"
          />
        </div>
      }
      actions={actions}
      className={product.isDeleted ? 'opacity-60' : ''}
    >
      <Card.Meta
        title={
          <div className="truncate" title={product.name}>
            {product.name}
          </div>
        }
        description={
          <div className="space-y-2">
            <div className="text-lg font-semibold text-blue-600">
              {formatCurrency(product.basePrice)}
            </div>
            
            <div className="text-sm text-gray-500">
              Category: {product.categoryId?.name || 'N/A'}
            </div>
            
            <div className="text-sm text-gray-500">
              SKU: {product.sku}
            </div>
            
            <Space wrap>
              <Tag color={product.stockQuantity > 0 ? 'green' : 'red'}>
                {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
              </Tag>
              
              {product.featured && <Tag color="blue">Featured</Tag>}
              {product.isCustomizable && <Tag color="purple">Customizable</Tag>}
              {product.isDeleted && <Tag color="red">Deleted</Tag>}
            </Space>
          </div>
        }
      />
    </Card>
  );
};

export default ProductCard;