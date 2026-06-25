import React from 'react';
import { Card } from 'antd';
import SearchFilter from '../../../../components/shared/SearchFilter';
import CategorySelect from '../categoryselect/CategorySelect';
import type { ProductFilters } from '../../services/productService';

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: Partial<ProductFilters>) => void;
  onClear: () => void;
}

const ProductFiltersComponent: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  onClear
}) => {
  const filterOptions = [
    {
      key: 'inStock',
      placeholder: 'Stock Status',
      value: filters.inStock?.toString(),
      onChange: (value: string) => onFiltersChange({ inStock: value === 'true' }),
      options: [
        { value: 'true', label: 'In Stock' },
        { value: 'false', label: 'Out of Stock' }
      ]
    },
    {
      key: 'featured',
      placeholder: 'Featured',
      value: filters.featured?.toString(),
      onChange: (value: string) => onFiltersChange({ featured: value === 'true' }),
      options: [
        { value: 'true', label: 'Featured' },
        { value: 'false', label: 'Not Featured' }
      ]
    }
  ];

  return (
    <Card className="mb-6">
      <div className="flex gap-4 mb-4">
        <SearchFilter
          searchValue={filters.search}
          onSearchChange={(value) => onFiltersChange({ search: value })}
          filters={filterOptions}
          onClear={onClear}
        />
        
        {/* Replace the category Select with CategorySelect component */}
        <div className="w-48">
          <CategorySelect
            value={filters.category}
            onChange={(value) => onFiltersChange({ category: value })}
            placeholder="Select category"
            allowClear
            treeSelect={true}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </Card>
  );
};

export default ProductFiltersComponent;