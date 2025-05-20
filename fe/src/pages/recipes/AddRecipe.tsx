import React, { useState } from 'react';
import { 
  ArrowLeft, Book, Save, Plus, Search, Filter, Trash2, 
  Image, Clock, MessageSquare, Edit, Check, X
} from 'lucide-react';

interface RecipeStep {
  id: string;
  content: string;
  imageUrl?: string;
}

interface RecipeIngredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

const AddRecipe: React.FC = () => {
  // Recipe basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  
  // Recipe ingredients
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { id: 'ing-1', name: '', quantity: '', unit: '' }
  ]);
  
  // Recipe steps
  const [steps, setSteps] = useState<RecipeStep[]>([
    { id: 'step-1', content: '' }
  ]);
  
  // Recipe nutrition
  const [nutrition, setNutrition] = useState<RecipeNutrition>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  });
  
  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Related product IDs
  const [relatedProducts, setRelatedProducts] = useState<string[]>([]);
  const [productInput, setProductInput] = useState('');
  
  // Form state
  const [activeTab, setActiveTab] = useState<'basic' | 'ingredients' | 'steps' | 'nutrition'>('basic');
  const [formChanged, setFormChanged] = useState(false);
  
  // Handle ingredient actions
  const addIngredient = () => {
    const newIngredient: RecipeIngredient = {
      id: `ing-${Date.now()}`,
      name: '',
      quantity: '',
      unit: ''
    };
    setIngredients([...ingredients, newIngredient]);
    setFormChanged(true);
  };
  
  const updateIngredient = (id: string, field: keyof RecipeIngredient, value: string) => {
    setIngredients(
      ingredients.map(ing => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
    setFormChanged(true);
  };
  
  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id));
      setFormChanged(true);
    }
  };
  
  // Handle step actions
  const addStep = () => {
    const newStep: RecipeStep = {
      id: `step-${Date.now()}`,
      content: ''
    };
    setSteps([...steps, newStep]);
    setFormChanged(true);
  };
  
  const updateStep = (id: string, content: string) => {
    setSteps(
      steps.map(step => (step.id === id ? { ...step, content } : step))
    );
    setFormChanged(true);
  };
  
  const updateStepImage = (id: string, imageUrl: string) => {
    setSteps(
      steps.map(step => (step.id === id ? { ...step, imageUrl } : step))
    );
    setFormChanged(true);
  };
  
  const removeStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(step => step.id !== id));
      setFormChanged(true);
    }
  };
  
  // Handle nutrition updates
  const updateNutrition = (field: keyof RecipeNutrition, value: string) => {
    setNutrition({
      ...nutrition,
      [field]: parseFloat(value) || 0
    });
    setFormChanged(true);
  };
  
  // Handle tag actions
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      setFormChanged(true);
    }
  };
  
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
    setFormChanged(true);
  };
  
  // Handle related product actions
  const addRelatedProduct = () => {
    if (productInput.trim() && !relatedProducts.includes(productInput.trim())) {
      setRelatedProducts([...relatedProducts, productInput.trim()]);
      setProductInput('');
      setFormChanged(true);
    }
  };
  
  const removeRelatedProduct = (product: string) => {
    setRelatedProducts(relatedProducts.filter(p => p !== product));
    setFormChanged(true);
  };
  
  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the recipe data object
    const recipeData = {
      title,
      description,
      category,
      prepTime,
      cookTime,
      servings,
      difficulty,
      thumbnailUrl,
      videoUrl,
      featured,
      ingredients,
      steps,
      nutrition,
      tags,
      relatedProducts
    };
    
    // Here you would normally send the data to your API
    console.log('Recipe Data:', recipeData);
    
    // Show success message
    alert('Công thức nấu ăn đã được tạo thành công!');
    setFormChanged(false);
  };
  
  // Handle discard changes
  const handleDiscard = () => {
    if (formChanged && !window.confirm('Bạn có chắc chắn muốn hủy? Tất cả các thay đổi sẽ bị mất.')) {
      return;
    }
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
              <Book className="mr-2" size={24} />
              Thêm công thức nấu ăn mới
            </h1>
          </div>
          <p className="mt-1 text-gray-500">Tạo công thức nấu ăn mới để giới thiệu đến khách hàng</p>
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
            Lưu công thức
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
            onClick={() => setActiveTab('ingredients')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ingredients'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Nguyên liệu
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'steps'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Các bước thực hiện
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'nutrition'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dinh dưỡng & Gợi ý
          </button>
        </nav>
      </div>
      
      {/* Form Content */}
      <div className="bg-white shadow-sm rounded-lg">
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          {activeTab === 'basic' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Title */}
                <div className="sm:col-span-4">
                  <label htmlFor="recipe-title" className="block text-sm font-medium text-gray-700">
                    Tên công thức <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="recipe-title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setFormChanged(true);
                      }}
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Ví dụ: Cơm chiên dương châu"
                    />
                  </div>
                </div>
                
                {/* Category */}
                <div className="sm:col-span-2">
                  <label htmlFor="recipe-category" className="block text-sm font-medium text-gray-700">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="recipe-category"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setFormChanged(true);
                      }}
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">Chọn danh mục</option>
                      <option value="appetizer">Khai vị</option>
                      <option value="main-course">Món chính</option>
                      <option value="soup">Súp</option>
                      <option value="salad">Salad</option>
                      <option value="dessert">Tráng miệng</option>
                      <option value="drink">Đồ uống</option>
                      <option value="breakfast">Bữa sáng</option>
                      <option value="snack">Ăn vặt</option>
                    </select>
                  </div>
                </div>
                
                {/* Description */}
                <div className="sm:col-span-6">
                  <label htmlFor="recipe-description" className="block text-sm font-medium text-gray-700">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="recipe-description"
                      rows={3}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setFormChanged(true);
                      }}
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Mô tả ngắn về công thức nấu ăn này"
                    ></textarea>
                  </div>
                </div>
                
                {/* Time and Servings */}
                <div className="sm:col-span-2">
                  <label htmlFor="prep-time" className="block text-sm font-medium text-gray-700">
                    Thời gian chuẩn bị (phút) <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      id="prep-time"
                      value={prepTime}
                      onChange={(e) => {
                        setPrepTime(e.target.value);
                        setFormChanged(true);
                      }}
                      min="0"
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="cook-time" className="block text-sm font-medium text-gray-700">
                    Thời gian nấu (phút) <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      id="cook-time"
                      value={cookTime}
                      onChange={(e) => {
                        setCookTime(e.target.value);
                        setFormChanged(true);
                      }}
                      min="0"
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="servings" className="block text-sm font-medium text-gray-700">
                    Khẩu phần (người) <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      id="servings"
                      value={servings}
                      onChange={(e) => {
                        setServings(e.target.value);
                        setFormChanged(true);
                      }}
                      min="1"
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                {/* Difficulty */}
                <div className="sm:col-span-3">
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                    Độ khó
                  </label>
                  <div className="mt-1">
                    <select
                      id="difficulty"
                      value={difficulty}
                      onChange={(e) => {
                        setDifficulty(e.target.value);
                        setFormChanged(true);
                      }}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="easy">Dễ</option>
                      <option value="medium">Trung bình</option>
                      <option value="hard">Khó</option>
                    </select>
                  </div>
                </div>
                
                {/* Featured */}
                <div className="sm:col-span-3">
                  <div className="flex items-start pt-5">
                    <div className="flex items-center h-5">
                      <input
                        id="featured"
                        type="checkbox"
                        checked={featured}
                        onChange={(e) => {
                          setFeatured(e.target.checked);
                          setFormChanged(true);
                        }}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="featured" className="font-medium text-gray-700">
                        Đánh dấu là công thức nổi bật
                      </label>
                      <p className="text-gray-500">Công thức nổi bật sẽ được hiển thị trên trang chủ</p>
                    </div>
                  </div>
                </div>
                
                {/* Image */}
                <div className="sm:col-span-6">
                  <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700">
                    Ảnh đại diện công thức <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex items-center">
                    <div className="flex-shrink-0 h-24 w-24 border-2 border-gray-300 border-dashed rounded-md flex items-center justify-center">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt="Thumbnail preview"
                          className="h-full w-full object-cover rounded-md"
                        />
                      ) : (
                        <Image className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="relative flex">
                        <input
                          type="text"
                          id="thumbnail"
                          value={thumbnailUrl}
                          onChange={(e) => {
                            setThumbnailUrl(e.target.value);
                            setFormChanged(true);
                          }}
                          placeholder="Nhập URL ảnh"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                        <input 
                          type="file" 
                          className="sr-only" 
                          accept="image/*"
                          id="thumbnail-upload"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF tối đa 5MB</p>
                      <label
                        htmlFor="thumbnail-upload"
                        className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Tải ảnh lên
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Video URL */}
                <div className="sm:col-span-6">
                  <label htmlFor="video-url" className="block text-sm font-medium text-gray-700">
                    URL Video hướng dẫn (tùy chọn)
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="video-url"
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        setFormChanged(true);
                      }}
                      placeholder="Ví dụ: https://www.youtube.com/watch?v=..."
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Hỗ trợ YouTube, Vimeo và các trang video phổ biến khác
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Ingredients */}
          {activeTab === 'ingredients' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Nguyên liệu</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Thêm tất cả nguyên liệu cần thiết cho công thức này
                </p>
              </div>
              
              <div className="space-y-4">
                {ingredients.map((ingredient, index) => (
                  <div key={ingredient.id} className="flex items-center gap-2">
                    <div className="w-full sm:w-1/2">
                      <input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                        placeholder="Tên nguyên liệu"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="w-1/5">
                      <input
                        type="text"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(ingredient.id, 'quantity', e.target.value)}
                        placeholder="Số lượng"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="w-1/5">
                      <input
                        type="text"
                        value={ingredient.unit}
                        onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                        placeholder="Đơn vị"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeIngredient(ingredient.id)}
                      className="flex-shrink-0 text-red-500 hover:text-red-700"
                      disabled={ingredients.length <= 1}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addIngredient}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm nguyên liệu
                </button>
              </div>
              
              <div className="mt-8">
                <div className="bg-yellow-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <MessageSquare className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Mẹo hay</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Sắp xếp các nguyên liệu theo thứ tự sử dụng trong công thức để giúp người đọc dễ theo dõi.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Steps */}
          {activeTab === 'steps' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Các bước thực hiện</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Chi tiết từng bước thực hiện công thức
                </p>
              </div>
              
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={step.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium text-gray-900">Bước {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeStep(step.id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={steps.length <= 1}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div>
                      <textarea
                        rows={3}
                        value={step.content}
                        onChange={(e) => updateStep(step.id, e.target.value)}
                        placeholder={`Mô tả chi tiết bước ${index + 1}`}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      ></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hình ảnh minh họa (tùy chọn)
                      </label>
                      <div className="mt-1 flex items-center">
                        <div className="flex-shrink-0 h-16 w-16 border border-gray-300 rounded-md flex items-center justify-center">
                          {step.imageUrl ? (
                            <img
                              src={step.imageUrl}
                              alt={`Step ${index + 1}`}
                              className="h-full w-full object-cover rounded-md"
                            />
                          ) : (
                            <Image className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-3">
                          <input
                            type="text"
                            value={step.imageUrl || ''}
                            onChange={(e) => updateStepImage(step.id, e.target.value)}
                            placeholder="URL hình ảnh"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addStep}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm bước
                </button>
              </div>
            </div>
          )}
          
          {/* Nutrition & Tags */}
          {activeTab === 'nutrition' && (
            <div className="p-6 space-y-6">
              {/* Nutrition Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900">Thông tin dinh dưỡng</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Cung cấp thông tin dinh dưỡng cho mỗi khẩu phần (không bắt buộc)
                </p>
                
                <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-5">
                  <div>
                    <label htmlFor="calories" className="block text-sm font-medium text-gray-700">
                      Calories
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        id="calories"
                        value={nutrition.calories || ''}
                        onChange={(e) => updateNutrition('calories', e.target.value)}
                        min="0"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="protein" className="block text-sm font-medium text-gray-700">
                      Protein (g)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        id="protein"
                        value={nutrition.protein || ''}
                        onChange={(e) => updateNutrition('protein', e.target.value)}
                        min="0"
                        step="0.1"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="carbs" className="block text-sm font-medium text-gray-700">
                      Carbs (g)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        id="carbs"
                        value={nutrition.carbs || ''}
                        onChange={(e) => updateNutrition('carbs', e.target.value)}
                        min="0"
                        step="0.1"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="fat" className="block text-sm font-medium text-gray-700">
                      Fat (g)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        id="fat"
                        value={nutrition.fat || ''}
                        onChange={(e) => updateNutrition('fat', e.target.value)}
                        min="0"
                        step="0.1"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="fiber" className="block text-sm font-medium text-gray-700">
                      Fiber (g)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        id="fiber"
                        value={nutrition.fiber || ''}
                        onChange={(e) => updateNutrition('fiber', e.target.value)}
                        min="0"
                        step="0.1"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tags */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-medium text-gray-900">Thẻ (Tags)</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Thêm các thẻ để giúp người dùng tìm kiếm công thức dễ dàng hơn
                </p>
                
                <div className="mt-4">
                  <div className="flex rounded-md shadow-sm">
                    <div className="relative flex-grow focus-within:z-10">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Nhập thẻ và nhấn Enter"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addTag}
                      className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      Thêm
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
                            onClick={() => removeTag(tag)}
                            className="flex-shrink-0 ml-0.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none focus:bg-indigo-500 focus:text-white"
                          >
                            <span className="sr-only">Remove tag {tag}</span>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Related Products */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-medium text-gray-900">Sản phẩm gợi ý</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Liên kết các sản phẩm liên quan đến công thức này (đồ dùng, nguyên liệu, v.v.)
                </p>
                
                <div className="mt-4">
                  <div className="flex rounded-md shadow-sm">
                    <div className="relative flex-grow focus-within:z-10">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={productInput}
                        onChange={(e) => setProductInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addRelatedProduct();
                          }
                        }}
                        placeholder="Nhập ID hoặc tên sản phẩm"
                        className="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addRelatedProduct}
                      className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      Thêm
                    </button>
                  </div>
                  
                  {relatedProducts.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700">Sản phẩm đã thêm:</h3>
                      <ul className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                        {relatedProducts.map(product => (
                          <li key={product} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <span className="ml-2 flex-1 w-0 truncate">
                                {product}
                              </span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => removeRelatedProduct(product)}
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                              >
                                Xóa
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
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
              Lưu công thức
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
              case 'ingredients':
                setActiveTab('basic');
                break;
              case 'steps':
                setActiveTab('ingredients');
                break;
              case 'nutrition':
                setActiveTab('steps');
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
                setActiveTab('ingredients');
                break;
              case 'ingredients':
                setActiveTab('steps');
                break;
              case 'steps':
                setActiveTab('nutrition');
                break;
              default:
                break;
            }
          }}
          disabled={activeTab === 'nutrition'}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeTab === 'nutrition'
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
          }`}
        >
          Tiếp theo
          <ArrowLeft className="inline ml-1 h-4 w-4 transform rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default AddRecipe;