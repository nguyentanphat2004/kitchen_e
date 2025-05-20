import React, { useState } from 'react';
import { 
  Tag, Search, PlusCircle, Edit, Trash2, Eye, 
  ArrowUpDown, ChevronLeft, ChevronRight, FilterX,
  Upload, MoreHorizontal
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  parentId?: string;
  slug: string;
  featured: boolean;
  productCount: number;
  displayOrder: number;
}

// Mock data
const mockCategories: Category[] = Array(20).fill(null).map((_, index) => ({
  id: `cat-${1000 + index}`,
  name: [
    'Dao/kéo', 'Nồi/chảo', 'Đồ điện tử', 'Phụ kiện nhà bếp', 
    'Bếp/lò', 'Dụng cụ làm bánh', 'Dụng cụ pha chế', 'Thiết bị lưu trữ'
  ][index % 8],
  description: `Mô tả cho danh mục ${index + 1} với nhiều thông tin chi tiết về các sản phẩm thuộc danh mục này.`,
  slug: [
    'dao-keo', 'noi-chao', 'do-dien-tu', 'phu-kien-nha-bep', 
    'bep-lo', 'dung-cu-lam-banh', 'dung-cu-pha-che', 'thiet-bi-luu-tru'
  ][index % 8],
  parentId: index % 3 === 0 ? undefined : `cat-${1000 + Math.floor(index / 3) * 3}`,
  featured: index % 5 === 0,
  productCount: Math.floor(Math.random() * 50) + 1,
  displayOrder: index + 1
}));

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Category>('displayOrder');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showTopLevelOnly, setShowTopLevelOnly] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Sorting
  const sortedCategories = [...categories].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Filtering
  const filteredCategories = sortedCategories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFeatured = showFeaturedOnly ? category.featured : true;
    const matchesTopLevel = showTopLevelOnly ? !category.parentId : true;
    return matchesSearch && matchesFeatured && matchesTopLevel;
  });

  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  // Handlers
  const handleSort = (field: keyof Category) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCategories(currentCategories.map(category => category.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(categoryId => categoryId !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddCategory = () => {
    setCurrentCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      setCategories(categories.filter(category => category.id !== id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedCategories.length} danh mục đã chọn?`)) {
      setCategories(categories.filter(category => !selectedCategories.includes(category.id)));
      setSelectedCategories([]);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setShowFeaturedOnly(false);
    setShowTopLevelOnly(false);
  };

  // Find parent category name
  const getParentCategoryName = (parentId?: string) => {
    if (!parentId) return '-';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Tag className="mr-2" size={24} />
          Quản lý danh mục
        </h1>
        <div className="mt-4 md:mt-0">
          <button 
            onClick={handleAddCategory}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="mr-2" size={16} />
            Thêm danh mục mới
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center">
              <input
                id="featured-only"
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={() => setShowFeaturedOnly(!showFeaturedOnly)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="featured-only" className="ml-2 block text-sm text-gray-700">
                Chỉ hiển thị nổi bật
              </label>
            </div>
            
            <div className="flex items-center ml-4">
              <input
                id="top-level-only"
                type="checkbox"
                checked={showTopLevelOnly}
                onChange={() => setShowTopLevelOnly(!showTopLevelOnly)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="top-level-only" className="ml-2 block text-sm text-gray-700">
                Chỉ hiển thị cấp cao nhất
              </label>
            </div>
            
            <button
              onClick={resetFilters}
              className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FilterX size={16} className="mr-2" />
              Xóa bộ lọc
            </button>
            
            <div className="relative ml-auto">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value={10}>10 mục</option>
                <option value={25}>25 mục</option>
                <option value={50}>50 mục</option>
                <option value={100}>100 mục</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Items Actions */}
      {selectedCategories.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-md flex items-center justify-between">
          <span className="text-indigo-700 font-medium">
            {selectedCategories.length} danh mục được chọn
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button className="px-3 py-1 bg-white text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50">
              Cập nhật hàng loạt
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="overflow-x-auto bg-white shadow-sm rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3 text-left">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    onChange={handleSelectAll}
                    checked={selectedCategories.length > 0 && selectedCategories.length === currentCategories.length}
                  />
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Tên danh mục
                  {sortField === 'name' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('slug')}
                >
                  Slug
                  {sortField === 'slug' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('parentId')}
                >
                  Danh mục cha
                  {sortField === 'parentId' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('productCount')}
                >
                  Số sản phẩm
                  {sortField === 'productCount' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('displayOrder')}
                >
                  Thứ tự
                  {sortField === 'displayOrder' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('featured')}
                >
                  Nổi bật
                  {sortField === 'featured' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-indigo-600 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentCategories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleSelectCategory(category.id)}
                    />
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 mr-3">
                      <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                        {category.image ? (
                          <img src={category.image} alt={category.name} className="h-10 w-10 rounded-md object-cover" />
                        ) : (
                          <Tag className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{category.slug}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{getParentCategoryName(category.parentId)}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{category.productCount}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{category.displayOrder}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    category.featured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.featured ? 'Nổi bật' : 'Thường'}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex justify-center space-x-2">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900" 
                      title="Xem chi tiết"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button 
                      className="text-blue-600 hover:text-blue-900"
                      title="Sửa" 
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900" 
                      title="Xóa"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900" title="Thêm">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, filteredCategories.length)}</span> của <span className="font-medium">{filteredCategories.length}</span> danh mục
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {showCategoryModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {currentCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
                    </h3>
                    <div className="mt-4">
                      <form className="space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Tên danh mục <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            defaultValue={currentCategory?.name || ''}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                            Slug <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="slug"
                            id="slug"
                            defaultValue={currentCategory?.slug || ''}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Mô tả
                          </label>
                          <textarea
                            name="description"
                            id="description"
                            rows={3}
                            defaultValue={currentCategory?.description || ''}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">
                            Danh mục cha
                          </label>
                          <select
                            id="parentId"
                            name="parentId"
                            defaultValue={currentCategory?.parentId || ''}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          >
                            <option value="">Không có danh mục cha</option>
                            {categories.filter(c => c.id !== currentCategory?.id).map(category => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700">
                            Thứ tự hiển thị
                          </label>
                          <input
                            type="number"
                            name="displayOrder"
                            id="displayOrder"
                            defaultValue={currentCategory?.displayOrder || 0}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="featured"
                              name="featured"
                              type="checkbox"
                              defaultChecked={currentCategory?.featured || false}
                              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="featured" className="font-medium text-gray-700">
                              Đánh dấu là danh mục nổi bật
                            </label>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Hình ảnh danh mục
                          </label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                >
                                  <span>Tải lên một tệp</span>
                                  <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                                </label>
                                <p className="pl-1">hoặc kéo và thả</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, GIF tối đa 2MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowCategoryModal(false)}
                >
                  {currentCategory ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowCategoryModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;