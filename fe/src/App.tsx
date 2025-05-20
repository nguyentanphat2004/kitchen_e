import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './components/layout/dashboard-layout';
import Clientsetup from './components/layout/Clientsetup';
import AuthPage from './pages/client/Auth/Authpage';
import AlwaysPanProductPage from './pages/client/Product/ProductDetail';
import CheckoutPage from './pages/client/Checkout/CheckoutPage';
import BakewareCategoryPage from './pages/client/Category/BakewareCategoryPage';
import OrdersPage from './pages/client/order/Myorder';
import ProfilePage from './pages/client/Auth/UserProfile';

// Lazy load all admin pages
const Dashboard = React.lazy(() => import('./pages/dashboard/dashboard-overview'));
const ProductList = React.lazy(() => import('./pages/products/ProductList'));
const CategoryManagement = React.lazy(() => import('./pages/products/CategoryManagement'));
const AddProduct = React.lazy(() => import('./pages/products/AddProduct'));
const Orders = React.lazy(() => import('./pages/orders/OrderList'));
const CustomerList = React.lazy(() => import('./pages/customers/CustomerList'));
const AddFlashSale = React.lazy(() => import('./pages/marketing/AddFlashSale'));
const FlashSaleList = React.lazy(() => import('./pages/marketing/FlashSaleList'));
const Vouchers = React.lazy(() => import('./pages/marketing/Vouchers'));
const BundleManagement = React.lazy(() => import('./pages/marketing/BundleManagement'));
const RecipeManagement = React.lazy(() => import('./pages/recipes/RecipeManagement'));
const AddRecipe = React.lazy(() => import('./pages/recipes/AddRecipe'));
const ReviewManagement = React.lazy(() => import('./pages/reviews/ReviewManagement'));
const NotificationManagement = React.lazy(() => import('./pages/notification/NotificationManagement'));
const SalesReport = React.lazy(() => import('./pages/reports/SalesReport'));
const BestsellersReport = React.lazy(() => import('./pages/reports/BestsellersReport'));
const CustomerReport = React.lazy(() => import('./pages/reports/CustomerReport'));
const AIAssistant = React.lazy(() => import('./pages/ai-assistant/AIAssitantManagement'));
const SystemSettings = React.lazy(() => import('./pages/settings/SystemSetting'));
const VouchersPage = React.lazy(() => import('./pages/client/Voucher/VouchersPage'));
// Loading component for Suspense
const Loading = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Client routes */}
        <Route path="/shop" element={<Clientsetup />}>
          <Route index element={<Navigate to="/shop/home" replace />} />
          <Route path="home" element={<div>Home Page</div>} />
          <Route path="category/:categoryId" element={<BakewareCategoryPage />} />
          <Route path="product/:productId" element={<AlwaysPanProductPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          
          {/* Account related pages */}
          <Route path="account">
            <Route index element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="vouchers" element={<VouchersPage />} />
            <Route path="wishlist" element={<div>Wishlist Page</div>} />
          </Route>
        </Route>

        {/* Authentication */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Admin Dashboard routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route 
          element={
            <DashboardLayout>
              <React.Suspense fallback={<Loading />}>
                <Outlet />
              </React.Suspense>
            </DashboardLayout>
          }
        >
          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Products */}
          <Route path="products">
            <Route index element={<ProductList />} />
            <Route path="add" element={<AddProduct />} />
            <Route path=":id/edit" element={<AddProduct />} />
            <Route path="categories" element={<CategoryManagement />} />
          </Route>
          
          {/* Orders */}
          <Route path="orders">
            <Route index element={<Orders />} />
            <Route path="processing" element={<Orders />} />
            <Route path="shipping" element={<Orders />} />
            <Route path="completed" element={<Orders />} />
            <Route path="cancelled" element={<Orders />} />
            <Route path=":id" element={<div>Order Details</div>} />
          </Route>
          
          {/* Customers */}
          <Route path="customers">
            <Route index element={<CustomerList />} />
            <Route path=":id" element={<div>Customer Details</div>} />
          </Route>
          
          {/* Marketing */}
          <Route path="marketing">
            <Route index element={<Navigate to="/marketing/flash-sales" replace />} />
            <Route path="vouchers" element={<Vouchers />} />
            <Route path="flash-sales" element={<FlashSaleList />} />
            <Route path="flash-sales/add" element={<AddFlashSale />} />
            <Route path="flash-sales/:id/edit" element={<AddFlashSale />} />
            <Route path="bundles" element={<BundleManagement />} />
            <Route path="bundles/add" element={<div>Add Bundle</div>} />
            <Route path="bundles/:id/edit" element={<div>Edit Bundle</div>} />
          </Route>
          
          {/* Recipes */}
          <Route path="recipes">
            <Route index element={<RecipeManagement />} />
            <Route path="add" element={<AddRecipe />} />
            <Route path=":id/edit" element={<AddRecipe />} />
          </Route>
          
          {/* Reviews */}
          <Route path="reviews" element={<ReviewManagement />} />
          
          {/* Notifications */}
          <Route path="notifications">
            <Route index element={<NotificationManagement />} />
            <Route path="create" element={<div>Create Notification</div>} />
            <Route path=":id/edit" element={<div>Edit Notification</div>} />
          </Route>
          
          {/* Reports */}
          <Route path="reports">
            <Route index element={<Navigate to="/reports/sales" replace />} />
            <Route path="sales" element={<SalesReport />} />
            <Route path="bestsellers" element={<BestsellersReport />} />
            <Route path="customers" element={<CustomerReport />} />
          </Route>
          
          {/* AI Assistant */}
          <Route path="ai-assistant" element={<AIAssistant />} />
          
          {/* Settings */}
          <Route path="settings" element={<SystemSettings />} />
        </Route>
        
        {/* Fallback route for 404 */}
        <Route path="*" element={
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
              <h2 className="text-2xl font-medium text-gray-600 mb-6">Không tìm thấy trang</h2>
              <a 
                href="/dashboard" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Trở về trang chủ
              </a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;