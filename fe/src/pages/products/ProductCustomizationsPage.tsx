import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Modal, Typography } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useProductCustomizations, useCreateCustomization, useUpdateCustomization, useDeleteCustomization } from '../../hooks/useCustomizations';
import type { Customization, CustomizationFormData } from '../../types/customization.types';
import CustomizationList from '../../components/customizations/CustomizationList';
import CustomizationForm from '../../components/customizations/CustomizationForm';
import LoadingState from '../../components/shared/LoadingState';
import { useProduct } from '../../hooks/useProducts';

const { Title } = Typography;

const ProductCustomizationsPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomization, setEditingCustomization] = useState<Customization | null>(null);

  // Fetch product info
  const { data: productData } = useProduct(productId!);
  
  // Fetch customizations
  const { data: customizations, isLoading } = useProductCustomizations(productId!);

  // Mutations
  const createCustomizationMutation = useCreateCustomization();
  const updateCustomizationMutation = useUpdateCustomization();
  const deleteCustomizationMutation = useDeleteCustomization();

  const product = productData?.product;

  const handleModalOpen = (customization?: Customization) => {
    setEditingCustomization(customization || null);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingCustomization(null);
  };

  const handleSubmit = async (data: CustomizationFormData) => {
    try {
      if (editingCustomization) {
        await updateCustomizationMutation.mutateAsync({
          productId: productId!,
          customizationId: editingCustomization._id,
          data
        });
      } else {
        await createCustomizationMutation.mutateAsync({
          productId: productId!,
          data
        });
      }
      handleModalClose();
    } catch (error) {
      console.error('Failed to save customization:', error);
    }
  };

  const handleDelete = (id: string) => {
    deleteCustomizationMutation.mutate({ productId: productId!, customizationId: id });
  };

  if (isLoading && !customizations) {
    return <LoadingState message="Loading customizations..." />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={2}>Product Customizations</Title>
          {product && (
            <p className="text-gray-600 mt-1">
              Managing customizations for: <span className="font-medium">{product.name}</span>
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => window.history.back()}
          >
            Back
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleModalOpen()}
          >
            Add Customization
          </Button>
        </div>
      </div>

      <Card>
        <CustomizationList
          customizations={customizations || []}
          loading={isLoading}
          onEdit={handleModalOpen}
          onDelete={handleDelete}
        />
      </Card>

      <Modal
        title={editingCustomization ? 'Edit Customization' : 'Add New Customization'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <CustomizationForm
          customization={editingCustomization || undefined}
          onSubmit={handleSubmit}
          onCancel={handleModalClose}
          isLoading={createCustomizationMutation.isLoading || updateCustomizationMutation.isLoading}
        />
      </Modal>
    </div>
  );
};

export default ProductCustomizationsPage;