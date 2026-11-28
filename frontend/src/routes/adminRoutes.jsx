import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
// Admin Pages
const AdminDashboardPage = React.lazy(() => import('../pages/admin/AdminDashboardPage.jsx'));
const UserManagementPage = React.lazy(() => import('../pages/admin/UserManagementPage.jsx'));
const CommunityManagementPage = React.lazy(() => import('../pages/admin/CommunityManagementPage.jsx'));
const ReportManagementPage = React.lazy(() => import('../pages/admin/ReportManagementPage.jsx'));
const PostManagementPage = React.lazy(() => import('../pages/admin/PostManagementPage.jsx'));
const CategoryManagementPage = React.lazy(() => import('../pages/admin/CategoryManagementPage.jsx'));
const ReputationSettingsPage = React.lazy(() => import('../pages/admin/ReputationSettingsPage'));
const UserDetailPage = React.lazy(() => import('../pages/admin/UserManagementPage.jsx').then(module => ({ default: module.UserDetailPage })));
const CommunityDetailPage = React.lazy(() => import('../pages/admin/CommunityManagementPage.jsx').then(module => ({ default: module.CommunityDetailPage })));
const PostDetailPage = React.lazy(() => import('../pages/admin/PostManagementPage.jsx').then(module => ({ default: module.PostDetailPage })));
const ReportDetailPage = React.lazy(() => import('../pages/admin/ReportManagementPage.jsx').then(module => ({ default: module.ReportDetailPage })));
const routeLoading = <div className="route-loading" role="status">Đang mở trang quản trị…</div>;
export const adminRoutes = <>
  <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      {/* 3. ADMIN PORTAL (ADMIN SIDEBAR & RESTRICTED ACCESS) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<React.Suspense fallback={routeLoading}><AdminDashboardPage /></React.Suspense>} />
        <Route path="users" element={<React.Suspense fallback={routeLoading}><UserManagementPage /></React.Suspense>} />
        <Route path="users/:userId" element={<React.Suspense fallback={routeLoading}><UserDetailPage /></React.Suspense>} />
        <Route path="communities" element={<React.Suspense fallback={routeLoading}><CommunityManagementPage /></React.Suspense>} />
        <Route path="communities/:communityId" element={<React.Suspense fallback={routeLoading}><CommunityDetailPage /></React.Suspense>} />
        <Route path="reports" element={<React.Suspense fallback={routeLoading}><ReportManagementPage /></React.Suspense>} />
        <Route path="reports/:type/:reportId" element={<React.Suspense fallback={routeLoading}><ReportDetailPage /></React.Suspense>} />
        <Route path="posts" element={<React.Suspense fallback={routeLoading}><PostManagementPage /></React.Suspense>} />
        <Route path="posts/:postId" element={<React.Suspense fallback={routeLoading}><PostDetailPage /></React.Suspense>} />
        <Route path="categories" element={<React.Suspense fallback={routeLoading}><CategoryManagementPage /></React.Suspense>} />
        <Route path="reputation" element={<React.Suspense fallback={routeLoading}><ReputationSettingsPage /></React.Suspense>} />
        <Route path="*" element={<div className="admin-empty"><h1>Không tìm thấy trang quản trị</h1><a href="/admin">Về tổng quan quản trị</a></div>} />
      </Route>

</>;
