import React from 'react';
import { Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
import AdminAuthLayout from '../layouts/AdminAuthLayout.jsx';
const LoginPage = React.lazy(() => import('../pages/auth/LoginPage'));
// Admin Pages
const AdminDashboardPage = React.lazy(() => import('../pages/admin/AdminDashboardPage.jsx'));
const UserManagementPage = React.lazy(() => import('../pages/admin/UserManagementPage.jsx'));
const CommunityManagementPage = React.lazy(() => import('../pages/admin/CommunityManagementPage.jsx'));
const ReportManagementPage = React.lazy(() => import('../pages/admin/ReportManagementPage.jsx'));
const PostManagementPage = React.lazy(() => import('../pages/admin/PostManagementPage.jsx'));
const CategoryManagementPage = React.lazy(() => import('../pages/admin/CategoryManagementPage.jsx'));
const routeLoading = <div className="route-loading" role="status">Đang mở trang quản trị…</div>;
export const adminRoutes = <>
  <Route element={<AdminAuthLayout />}>
    <Route path="/admin/login" element={<React.Suspense fallback={routeLoading}><LoginPage admin /></React.Suspense>} />
  </Route>
      {/* 3. ADMIN PORTAL (ADMIN SIDEBAR & RESTRICTED ACCESS) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<React.Suspense fallback={routeLoading}><AdminDashboardPage /></React.Suspense>} />
        <Route path="users" element={<React.Suspense fallback={routeLoading}><UserManagementPage /></React.Suspense>} />
        <Route path="communities" element={<React.Suspense fallback={routeLoading}><CommunityManagementPage /></React.Suspense>} />
        <Route path="reports" element={<React.Suspense fallback={routeLoading}><ReportManagementPage /></React.Suspense>} />
        <Route path="posts" element={<React.Suspense fallback={routeLoading}><PostManagementPage /></React.Suspense>} />
        <Route path="categories" element={<React.Suspense fallback={routeLoading}><CategoryManagementPage /></React.Suspense>} />
        <Route path="*" element={<div className="admin-empty"><h1>Không tìm thấy trang quản trị</h1><a href="/admin">Về tổng quan quản trị</a></div>} />
      </Route>

</>;
