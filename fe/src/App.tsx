import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useRoutes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/contexts/auth-context';
import DashboardLayout from './components/layout/dashboard-layout';
import Clientsetup from './components/layout/Clientsetup';
import CheckoutPage from './pages/client/Checkout/CheckoutPage';
import BakewareCategoryPage from './pages/client/Category/BakewareCategoryPage';
import OrdersPage from './pages/client/order/Myorder';
import AlwaysPanProductPage from './pages/client/Product/ProductDetail';
import { authRoutes } from './features/auth/routes/auth-routes';
import ProtectedRoute from './features/auth/components/protected-route';
import AddProductPage from './features/products/pages/dashboard/AddProductPage';
import EditProductPage from './features/products/pages/dashboard/EditProductPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import ProductListPage from './pages/products/ProductListPage';
import ProductCustomizationsPage from './features/products/pages/dashboard/ProductCustomizationsPage';
import UserList from './pages/users/UserList';

// Lazy load all admin pages
const Dashboard = React.lazy(() => import('./pages/dashboard/dashboard-overview'));
const CategoryManagement = React.lazy(() => import('./pages/products/CategoryManagement'));
const ProductCustomizations = React.lazy(() => import('./features/products/components/ProductCustomizations/ProductCustomizations'));
const Orders = React.lazy(() => import('./pages/orders/OrderList'));
const CustomerList = React.lazy(() => import('./pages/users/UserList'));
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

// Import your profile page
const ProfilePage = React.lazy(() => import('./features/auth/pages/profile-page'));

// Loading component for Suspense
const Loading = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppRoutes: React.FC = () => {

  const routes = [

    ...authRoutes,
    

    {
      path: '/auth',
      element: <Navigate to="/auth/login" replace />
    },
    
    // Client routes
    {
      path: '/shop',
      children: [
        { index: true, element: <Navigate to="/shop/home" replace /> },
        { path: 'home', element: <Clientsetup /> },
        { path: 'category/:categoryId', element: <BakewareCategoryPage /> },
        { path: 'product/:productId', element: <AlwaysPanProductPage /> },
        { path: 'checkout', element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
        
        // Account related pages
        {
          path: 'account',
          children: [
            { index: true, element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
            { path: 'orders', element: <ProtectedRoute><OrdersPage /></ProtectedRoute> },
            { path: 'vouchers', element: <ProtectedRoute><VouchersPage /></ProtectedRoute> },
            { path: 'wishlist', element: <ProtectedRoute><div>Wishlist Page</div></ProtectedRoute> },
          ]
        }
      ]
    },
    
    // Admin Dashboard routes
    {
      path: '/',
      element: <Navigate to="/dashboard" replace />
    },
    {
      path: '/',
      element: (
        <DashboardLayout>
          <React.Suspense fallback={<Loading />}>
            <Outlet />
          </React.Suspense>
        </DashboardLayout>
      ),
      children: [
        // Dashboard
        { path: 'dashboard', element: <Dashboard /> },
        
        // Products
        {
          path: 'products',
          children: [
            { index: true, element: <ProductListPage /> },
            { path: 'add', element: <AddProductPage /> },
            { path: ':id', element: < ProductDetailPage   /> },
            { path: ':id/edit', element: <EditProductPage /> },
            { path: 'categories', element: <CategoryManagement /> },
            { path: ':id/customizations', element: <ProductCustomizationsPage /> }
          ]
        },
        
        // Orders
        {
          path: 'orders',
          children: [
            { index: true, element: <Orders /> },
            { path: 'processing', element: <Orders /> },
            { path: 'shipping', element: <Orders /> },
            { path: 'completed', element: <Orders /> },
            { path: 'cancelled', element: <Orders /> },
            { path: ':id', element: <div>Order Details</div> }
          ]
        },
        
        // Customers
        {
          path: 'customers',
          children: [
            { index: true, element: <UserList /> },
            // { path: ':id', element: <div>Customer Details</div> }
          ]
        },
        
        // Marketing
        {
          path: 'marketing',
          children: [
            { index: true, element: <Navigate to="/marketing/flash-sales" replace /> },
            { path: 'vouchers', element: <Vouchers /> },
            { path: 'flash-sales', element: <FlashSaleList /> },
            { path: 'flash-sales/add', element: <AddFlashSale /> },
            { path: 'flash-sales/:id/edit', element: <AddFlashSale /> },
            { path: 'bundles', element: <BundleManagement /> },
            { path: 'bundles/add', element: <div>Add Bundle</div> },
            { path: 'bundles/:id/edit', element: <div>Edit Bundle</div> }
          ]
        },
        
        // Recipes
        {
          path: 'recipes',
          children: [
            { index: true, element: <RecipeManagement /> },
            { path: 'add', element: <AddRecipe /> },
            { path: ':id/edit', element: <AddRecipe /> }
          ]
        },
        
        // Reviews
        { path: 'reviews', element: <ReviewManagement /> },
        
        // Notifications
        {
          path: 'notifications',
          children: [
            { index: true, element: <NotificationManagement /> },
            { path: 'create', element: <div>Create Notification</div> },
            { path: ':id/edit', element: <div>Edit Notification</div> }
          ]
        },
        
        // Reports
        {
          path: 'reports',
          children: [
            { index: true, element: <Navigate to="/reports/sales" replace /> },
            { path: 'sales', element: <SalesReport /> },
            { path: 'bestsellers', element: <BestsellersReport /> },
            { path: 'customers', element: <CustomerReport /> }
          ]
        },
        
        // AI Assistant
        { path: 'ai-assistant', element: <AIAssistant /> },
        
        // Settings
        { path: 'settings', element: <SystemSettings /> }
      ]
    },
    
    // Fallback route for 404
    {
      path: '*',
      element: (
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
      )
    }
  ];
  
  const element = useRoutes(routes);
  return element;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-right" />
        <AuthProvider>
          <React.Suspense fallback={<Loading />}>
            <AppRoutes />
          </React.Suspense>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;