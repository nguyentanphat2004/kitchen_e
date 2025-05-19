import React, { useState } from 'react';
import { 
  Package, Save, X, Plus, Trash2, Image, CheckCircle, AlertCircle, 
  HelpCircle, ArrowLeft, DollarSign, Tag
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  color?: string;
  size?: string;
  material?: string;
}

interface ProductImage {
  id: string;
  file?: File;
  preview: string;
  isPrimary: boolean;
}

interface CustomizationOption {
  id: string;
  name: string;
  priceAdjustment: number;
}

interface Customization {
  id: string;
  name: string;
  type: 'color' | 'size' | 'material' | 'engraving' | 'packaging' | 'other';
  required: boolean;
  options: CustomizationOption[];
}

// Mock categories
const mockCategories: Category[] = [
  { id: 'cat1', name: 'Dao/kéo' },
  { id: 'cat2', name: 'Nồi/chảo' },
  { id: 'cat3', name: 'Đồ điện tử' },
  { id: 'cat4', name: 'Phụ kiện nhà bếp' },
  { id: 'cat5', name: 'Bếp/lò' },
];

const AddProduct: React.FC = () => {
  // Basic product information
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [basePrice, setBasePrice] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState<number | string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  
  // Product images
  const [images, setImages] = useState<ProductImage[]>([]);
  
  // Variants & Customization
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [hasCustomizations, setHasCustomizations] = useState(false);
  const [customizations, setCustomizations] = useState<Customization[]>([]);
  
  // Form state
  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'variants' | 'customizations'>('basic');
  const [formChanged, setFormChanged] = useState(false);
  
  // Handlers for basic info
  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
      setFormChanged(true);
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
    setFormChanged(true);
  };
  
  // Handler for image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImages: ProductImage[] = filesArray.map(file => ({
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        isPrimary: images.length === 0, // First image is primary by default
      }));
      
      setImages([...images, ...newImages]);
      setFormChanged(true);
    }
  };
  
  const handleRemoveImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove && imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const newImages = images.filter(img => img.id !== id);
    // If we're removing the primary image, set the first remaining image as primary
    if (imageToRemove?.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    
    setImages(newImages);
    setFormChanged(true);
  };
  
  const handleSetPrimaryImage = (id: string) => {
    setImages(images.map(img => ({
      ...img,
      isPrimary: img.id === id
    })));
    setFormChanged(true);
  };
  
  // Handlers for variants
  const handleAddVariant = () => {
    const newVariant: Variant = {
      id: `variant-${Date.now()}`,
      name: '',
      sku: `${sku || 'SKU'}-${variants.length + 1}`,
      price: Number(basePrice) || 0,
      stock: Number(stock) || 0,
    };
    
    setVariants([...variants, newVariant]);
    setFormChanged(true);
  };
  
  const handleUpdateVariant = (id: string, field: keyof Variant, value: string | number) => {
    setVariants(variants.map(variant => 
      variant.id === id ? { ...variant, [field]: value } : variant
    ));
    setFormChanged(true);
  };
  
  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter(variant => variant.id !== id));
    setFormChanged(true);
  };
  
  // Handlers for customizations
  const handleAddCustomization = () => {
    const newCustomization: Customization = {
      id: `customization-${Date.now()}`,
      name: '',
      type: 'other',
      required: false,
      options: [{
        id: `option-${Date.now()}`,
        name: '',
        priceAdjustment: 0
      }]
    };
    
    setCustomizations([...customizations, newCustomization]);
    setFormChanged(true);
  };
  
  const handleUpdateCustomization = (id: string, field: keyof Customization, value: string | boolean) => {
    setCustomizations(customizations.map(customization => 
      customization.id === id ? { ...customization, [field]: value } : customization
    ));
    setFormChanged(true);
  };
  
  const handleRemoveCustomization = (id: string) => {
    setCustomizations(customizations.filter(customization => customization.id !== id));
    setFormChanged(true);
  };
  
  const handleAddCustomizationOption = (customizationId: string) => {
    setCustomizations(customizations.map(customization => {
      if (customization.id === customizationId) {
        return {
          ...customization,
          options: [
            ...customization.options,
            {
              id: `option-${Date.now()}`,
              name: '',
              priceAdjustment: 0
            }
          ]
        };
      }
      return customization;
    }));
    setFormChanged(true);
  };
  
  const handleUpdateCustomizationOption = (
    customizationId: string, 
    optionId: string, 
    field: keyof CustomizationOption, 
    value: string | number
  ) => {
    setCustomizations(customizations.map(customization => {
      if (customization.id === customizationId) {
        return {
          ...customization,
          options: customization.options.map(option => 
            option.id === optionId ? { ...option, [field]: value } : option
          )
        };
      }
      return customization;
    }));
    setFormChanged(true);
  };
  
  const handleRemoveCustomizationOption = (customizationId: string, optionId: string) => {
    setCustomizations(customizations.map(customization => {
      if (customization.id === customizationId) {
        return {
          ...customization,
          options: customization.options.filter(option => option.id !== optionId)
        };
      }
      return customization;
    }));
    setFormChanged(true);
  };
  
  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would normally send the data to your API
    // For now, let's just log the data to the console
    console.log({
      productName,
      sku,
      basePrice,
      description,
      categoryId,
      stock,
      tags,
      images,
      hasVariants,
      variants,
      hasCustomizations,
      customizations
    });
    
    // Reset form or redirect to product list
    alert('Sản phẩm đã được tạo thành công!');
  };
  
  // Discard changes confirmation
  const handleDiscard = () => {
    if (formChanged && !window.confirm('Bạn có chắc chắn muốn hủy? Tất cả các thay đổi sẽ bị mất.')) {
      return;
    }
    // Redirect back to product list
    window.history.back();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center">
            <button 
              onClick={handleDiscard}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Package className="mr-2" size={24} />
              Thêm sản phẩm mới
            </h1>
          </div>
          <p className="mt-1 text-gray-500">Thêm thông tin chi tiết về sản phẩm của bạn</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDiscard}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Save className="w-4 h-4 inline mr-1" />
            Lưu sản phẩm
          </button>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'basic'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Thông tin cơ bản
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'images'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Hình ảnh sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('variants')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'variants'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Biến thể sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('customizations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'customizations'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tùy chỉnh sản phẩm
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white shadow-sm rounded-lg">
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          {activeTab === 'basic' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Product Name */}
                <div className="sm:col-span-4">
                  <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="productName"
                      name="productName"
                      value={productName}
                      onChange={(e) => {
                        setProductName(e.target.value);
                        setFormChanged(true);
                      }}
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                {/* SKU */}
                <div className="sm:col-span-2">
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                    Mã SKU <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="sku"
                      name="sku"
                      value={sku}
                      onChange={(e) => {
                        setSku(e.target.value);
                        setFormChanged(true);
                      }}
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                {/* Category */}
                <div className="sm:col-span-3">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="category"
                      name="category"
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        setFormChanged(true);
                      }}
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">Chọn danh mục</option>
                      {mockCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Price */}
                <div className="sm:col-span-2">
                  <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
                    Giá cơ bản (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="basePrice"
                      name="basePrice"
                      value={basePrice}
                      onChange={(e) => {
                        setBasePrice(e.target.value);
                        setFormChanged(true);
                      }}
                      min="0"
                      step="1000"
                      required
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">VNĐ</span>
                    </div>
                  </div>
                </div>
                
                {/* Stock */}
                <div className="sm:col-span-1">
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                    Tồn kho <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={stock}
                      onChange={(e) => {
                        setStock(e.target.value);
                        setFormChanged(true);
                      }}
                      min="0"
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                {/* Description */}
                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Mô tả sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setFormChanged(true);
                      }}
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Viết mô tả chi tiết về sản phẩm. Nên trình bày đầy đủ thông số kỹ thuật, công dụng, và hướng dẫn sử dụng.
                  </p>
                </div>
                
                {/* Tags */}
                <div className="sm:col-span-6">
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                    Thẻ (tags)
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="relative flex items-stretch flex-grow focus-within:z-10">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-gray-300"
                        placeholder="Thêm thẻ"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <Plus className="h-5 w-5 text-gray-400" />
                      <span>Thêm</span>
                    </button>
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex rounded-full items-center py-0.5 pl-2.5 pr-1 text-sm font-medium bg-indigo-100 text-indigo-700"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="flex-shrink-0 ml-0.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none focus:bg-indigo-500 focus:text-white"
                          >
                            <span className="sr-only">Xóa thẻ {tag}</span>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Images */}
          {activeTab === 'images' && (
            <div className="p-6 space-y-6">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Hình ảnh sản phẩm</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Thêm hình ảnh sản phẩm (tối đa 8 ảnh). Ảnh đầu tiên sẽ là ảnh chính.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <Image className="mr-2 h-5 w-5 text-gray-400" />
                      Thêm ảnh
                    </label>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className={`aspect-w-1 aspect-h-1 rounded-lg bg-gray-100 overflow-hidden ${image.isPrimary ? 'ring-2 ring-indigo-500' : ''}`}>
                        <img
                          src={image.preview}
                          alt="Product preview"
                          className="object-center object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 bg-opacity-50">
                          <div className="flex space-x-2">
                            {!image.isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(image.id)}
                                className="p-2 bg-white rounded-full text-gray-700 hover:text-indigo-600"
                                title="Đặt làm ảnh chính"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(image.id)}
                              className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600"
                              title="Xóa ảnh"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {image.isPrimary && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-indigo-500 text-white text-xs font-medium rounded">
                          Ảnh chính
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {images.length === 0 && (
                    <div className="sm:col-span-6">
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <Image className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload-empty" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                              <span>Tải ảnh lên</span>
                              <input
                                id="file-upload-empty"
                                name="file-upload-empty"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                              />
                            </label>
                            <p className="pl-1">hoặc kéo và thả</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF tối đa 10MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Variants */}
          {activeTab === 'variants' && (
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Biến thể sản phẩm</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Tạo các biến thể khác nhau của sản phẩm (màu sắc, kích thước, v.v.).
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="form-switch inline-block align-middle">
                      <input 
                        type="checkbox" 
                        name="hasVariants" 
                        id="hasVariants" 
                        className="form-switch-checkbox hidden" 
                        checked={hasVariants}
                        onChange={() => {
                          setHasVariants(!hasVariants);
                          setFormChanged(true);
                        }}
                      />
                      <label className="form-switch-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer" htmlFor="hasVariants"></label>
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {hasVariants ? 'Đã bật' : 'Đã tắt'}
                    </span>
                  </div>
                </div>
                
                {hasVariants ? (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium text-gray-900">Danh sách biến thể</h4>
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Thêm biến thể
                      </button>
                    </div>
                    
                    {variants.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên biến thể</th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá (VNĐ)</th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thuộc tính</th>
                              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {variants.map((variant) => (
                              <tr key={variant.id}>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={variant.name}
                                    onChange={(e) => handleUpdateVariant(variant.id, 'name', e.target.value)}
                                    placeholder="Tên biến thể"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  />
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={variant.sku}
                                    onChange={(e) => handleUpdateVariant(variant.id, 'sku', e.target.value)}
                                    placeholder="SKU-VAR1"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  />
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={variant.price}
                                    onChange={(e) => handleUpdateVariant(variant.id, 'price', e.target.value)}
                                    min="0"
                                    step="1000"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  />
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={variant.stock}
                                    onChange={(e) => handleUpdateVariant(variant.id, 'stock', e.target.value)}
                                    min="0"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  />
                                </td>
                                <td className="px-3 py-4">
                                  <div className="flex flex-col space-y-2">
                                    <input
                                      type="text"
                                      value={variant.color || ''}
                                      onChange={(e) => handleUpdateVariant(variant.id, 'color', e.target.value)}
                                      placeholder="Màu sắc"
                                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    />
                                    <input
                                      type="text"
                                      value={variant.size || ''}
                                      onChange={(e) => handleUpdateVariant(variant.id, 'size', e.target.value)}
                                      placeholder="Kích thước"
                                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    />
                                    <input
                                      type="text"
                                      value={variant.material || ''}
                                      onChange={(e) => handleUpdateVariant(variant.id, 'material', e.target.value)}
                                      placeholder="Chất liệu"
                                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    />
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariant(variant.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
                        <p className="text-sm text-gray-500">Chưa có biến thể nào. Nhấn "Thêm biến thể" để bắt đầu.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 text-center p-12 border-2 border-dashed border-gray-300 rounded-md">
                    <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Không có biến thể</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Bật tùy chọn biến thể nếu sản phẩm của bạn có nhiều phiên bản khác nhau (màu sắc, kích thước, v.v.).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Customizations */}
          {activeTab === 'customizations' && (
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Tùy chỉnh sản phẩm</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Thêm các tùy chọn cho phép khách hàng cá nhân hóa sản phẩm.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="form-switch inline-block align-middle">
                      <input 
                        type="checkbox" 
                        name="hasCustomizations" 
                        id="hasCustomizations" 
                        className="form-switch-checkbox hidden" 
                        checked={hasCustomizations}
                        onChange={() => {
                          setHasCustomizations(!hasCustomizations);
                          setFormChanged(true);
                        }}
                      />
                      <label className="form-switch-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer" htmlFor="hasCustomizations"></label>
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {hasCustomizations ? 'Đã bật' : 'Đã tắt'}
                    </span>
                  </div>
                </div>
                
                {hasCustomizations ? (
                  <div className="mt-6 space-y-6">
                    {customizations.map((customization) => (
                      <div 
                        key={customization.id} 
                        className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-200"
                      >
                        <div className="px-4 py-5 sm:p-6">
                          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                              <label htmlFor={`customization-name-${customization.id}`} className="block text-sm font-medium text-gray-700">
                                Tên tùy chỉnh
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id={`customization-name-${customization.id}`}
                                  value={customization.name}
                                  onChange={(e) => handleUpdateCustomization(customization.id, 'name', e.target.value)}
                                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  placeholder="Ví dụ: Màu sắc, Khắc tên..."
                                />
                              </div>
                            </div>
                            
                            <div className="sm:col-span-2">
                              <label htmlFor={`customization-type-${customization.id}`} className="block text-sm font-medium text-gray-700">
                                Loại tùy chỉnh
                              </label>
                              <div className="mt-1">
                                <select
                                  id={`customization-type-${customization.id}`}
                                  value={customization.type}
                                  onChange={(e) => handleUpdateCustomization(customization.id, 'type', e.target.value)}
                                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                >
                                  <option value="color">Màu sắc</option>
                                  <option value="size">Kích thước</option>
                                  <option value="material">Chất liệu</option>
                                  <option value="engraving">Khắc tên</option>
                                  <option value="packaging">Đóng gói</option>
                                  <option value="other">Khác</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="sm:col-span-1">
                              <div className="flex items-start">
                                <div className="flex h-5 items-center">
                                  <input
                                    id={`customization-required-${customization.id}`}
                                    type="checkbox"
                                    checked={customization.required}
                                    onChange={(e) => handleUpdateCustomization(customization.id, 'required', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor={`customization-required-${customization.id}`} className="font-medium text-gray-700">
                                    Bắt buộc
                                  </label>
                                </div>
                              </div>
                            </div>
                            
                            <div className="sm:col-span-6">
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Tùy chọn
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleAddCustomizationOption(customization.id)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Thêm tùy chọn
                                </button>
                              </div>
                              
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên tùy chọn</th>
                                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phụ phí (VNĐ)</th>
                                      <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {customization.options.map((option) => (
                                      <tr key={option.id}>
                                        <td className="px-3 py-4 whitespace-nowrap">
                                          <input
                                            type="text"
                                            value={option.name}
                                            onChange={(e) => handleUpdateCustomizationOption(customization.id, option.id, 'name', e.target.value)}
                                            placeholder="Tên tùy chọn"
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                          />
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap">
                                          <input
                                            type="number"
                                            value={option.priceAdjustment}
                                            onChange={(e) => handleUpdateCustomizationOption(customization.id, option.id, 'priceAdjustment', e.target.value)}
                                            placeholder="0"
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                          />
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-center">
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveCustomizationOption(customization.id, option.id)}
                                            className="text-red-600 hover:text-red-900"
                                            disabled={customization.options.length <= 1}
                                          >
                                            <Trash2 className={`h-5 w-5 ${customization.options.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomization(customization.id)}
                              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa tùy chỉnh
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {customizations.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-md">
                        <p className="text-sm text-gray-500">Chưa có tùy chỉnh nào. Nhấn "Thêm tùy chỉnh" để bắt đầu.</p>
                      </div>
                    )}
                    
                    <div className="flex justify-center mt-6">
                      <button
                        type="button"
                        onClick={handleAddCustomization}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Thêm tùy chỉnh
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 text-center p-12 border-2 border-dashed border-gray-300 rounded-md">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Không có tùy chỉnh</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Bật tùy chọn tùy chỉnh nếu khách hàng có thể cá nhân hóa sản phẩm (chọn màu, khắc tên, v.v.).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 flex justify-end">
            <button
              type="button"
              onClick={handleDiscard}
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Save className="w-4 h-4 inline mr-1" />
              Lưu sản phẩm
            </button>
          </div>
        </form>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => {
            switch (activeTab) {
              case 'images':
                setActiveTab('basic');
                break;
              case 'variants':
                setActiveTab('images');
                break;
              case 'customizations':
                setActiveTab('variants');
                break;
              default:
                break;
            }
          }}
          disabled={activeTab === 'basic'}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeTab === 'basic'
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
          }`}
        >
          <ArrowLeft className="inline mr-1 h-4 w-4" />
          Quay lại
        </button>
        <button
          type="button"
          onClick={() => {
            switch (activeTab) {
              case 'basic':
                setActiveTab('images');
                break;
              case 'images':
                setActiveTab('variants');
                break;
              case 'variants':
                setActiveTab('customizations');
                break;
              default:
                break;
            }
          }}
          disabled={activeTab === 'customizations'}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeTab === 'customizations'
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
          }`}
        >
          Tiếp theo
          <ArrowLeft className="inline ml-1 h-4 w-4 transform rotate-180" />
        </button>
      </div>
      
      {/* Custom style for switch toggle */}
      <style jsx>{`
        .form-switch-checkbox:checked + .form-switch-label {
          background-color: #4f46e5;
        }
        .form-switch-label {
          transition: background-color 0.2s ease-in;
        }
        .form-switch-label:before {
          position: absolute;
          content: "";
          height: 1.25rem;
          width: 1.25rem;
          left: 0.25rem;
          bottom: 0.25rem;
          background-color: white;
          border-radius: 9999px;
          transition: transform 0.2s ease-in;
        }
        .form-switch-checkbox:checked + .form-switch-label:before {
          transform: translateX(1.5rem);
        }
      `}</style>
    </div>
  );
};

export default AddProduct;
