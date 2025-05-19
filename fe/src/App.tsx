import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './components/layout/dashboard-layout';
import SystemSettings from './pages/settings/SystemSetting';

// Lazy load các trang
const Dashboard = React.lazy(() => import('./pages/dashboard/dashboard-overview'));
const Products = React.lazy(() => import('./pages/products/ProductList'));
const AddProduct = React.lazy(() => import('./pages/products/AddProduct'));
const Orders = React.lazy(() => import('./pages/orders/OrderList'));
const Customers = React.lazy(() => import('./pages/customers/CustomerList'));
const AddFlashSale = React.lazy(() => import('./pages/marketing/AddFlashSale'));
const Vouchers = React.lazy(() => import('./pages/marketing/Vouchers'));
// const Recipes = React.lazy(() => import('./pages/recipes'));
const Reports = React.lazy(() => import('./pages/reports/SalesReport'));
const AIAssistant = React.lazy(() => import('./pages/ai-assistant/AIAssitantManagement'));

const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<DashboardLayout><Outlet /></DashboardLayout>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products/*" element={<Products />} />
          <Route path="orders/*" element={<Orders />} />
          <Route path="AddProduct/*" element={<AddProduct />} />
          <Route path="customers/*" element={<Customers />} />
          <Route path="Vouchers/*" element={<Vouchers />} />
          {/* <Route path="recipes/*" element={<Recipes />} /> */}
          <Route path="flashe/*" element={<AddFlashSale />} />
          <Route path="reports/*" element={<Reports />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
