import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import SettingsLayout from '../layouts/SettingsLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/common/StoreProtectedRoute';

// Public & Feed Pages
const HomePage = React.lazy(() => import('../pages/home/HomePage'));
const ExplorePage = React.lazy(() => import('../pages/explore/ExplorePage'));
const SearchResultsPage = React.lazy(() => import('../pages/search/SearchResultsPage'));
const CommunityDetailPage = React.lazy(() => import('../pages/community/CommunityDetailPage'));
const PostDetailPage = React.lazy(() => import('../pages/post/PostDetailPage'));
const UserProfilePage = React.lazy(() => import('../pages/profile/UserProfilePage'));

// Auth Pages
const LoginPage = React.lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../pages/auth/RegisterPage'));
const VerifyEmailPage = React.lazy(() => import('../pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = React.lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('../pages/auth/ResetPasswordPage'));
const TermsOfUsePage = React.lazy(() => import('../pages/auth/TermsOfUsePage'));

// Authenticated Pages
const NotificationsPage = React.lazy(() => import('../pages/notifications/NotificationsPage'));
const MessagesPage = React.lazy(() => import('../pages/messages/MessagesPage'));
const SavedPostsPage = React.lazy(() => import('../pages/saved/SavedPostsPage'));

// Settings Pages
const GeneralSettingsPage = React.lazy(() => import('../pages/settings/GeneralSettingsPage'));
const EditProfilePage = React.lazy(() => import('../pages/settings/EditProfilePage'));
const AccountSettingsPage = React.lazy(() => import('../pages/settings/AccountSettingsPage'));
const PrivacySettingsPage = React.lazy(() => import('../pages/settings/PrivacySettingsPage'));
const AppearanceSettingsPage = React.lazy(() => import('../pages/settings/AppearanceSettingsPage'));
const NotificationSettingsPage = React.lazy(() => import('../pages/settings/NotificationSettingsPage'));

// Community Management Pages
const CreateCommunityPage = React.lazy(() => import('../pages/community/CreateCommunityPage'));
const MyCommunitiesPage = React.lazy(() => import('../pages/community/MyCommunitiesPage'));
const EditCommunityPage = React.lazy(() => import('../pages/community/EditCommunityPage'));
const CommunityMembersPage = React.lazy(() => import('../pages/community/CommunityMembersPage'));
const CommunityModerationPage = React.lazy(() => import('../pages/community/CommunityModerationPage'));

// Admin Pages
const AdminDashboardPage = React.lazy(() => import('../pages/admin/AdminDashboardPage'));
const UserManagementPage = React.lazy(() => import('../pages/admin/UserManagementPage'));
const CommunityManagementPage = React.lazy(() => import('../pages/admin/CommunityManagementPage'));
const ReportManagementPage = React.lazy(() => import('../pages/admin/ReportManagementPage'));

// Error Pages
const AccessDeniedPage = React.lazy(() => import('../pages/error/AccessDeniedPage'));
const NotFoundPage = React.lazy(() => import('../pages/error/NotFoundPage'));

const routeLoading = <div role="status" aria-live="polite" className="route-loading"><span />Đang mở nội dung…</div>;

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. MAIN APP SHELL (WITH NAVBAR & SIDEBAR) */}
      <Route element={<AppLayout />}>
        {/* Core Feeds */}
        <Route path="/" element={<React.Suspense fallback={routeLoading}><HomePage /></React.Suspense>} />
        <Route path="/explore" element={<React.Suspense fallback={routeLoading}><ExplorePage /></React.Suspense>} />
        <Route path="/explore/:slug" element={<React.Suspense fallback={routeLoading}><ExplorePage /></React.Suspense>} />
        <Route path="/search" element={<React.Suspense fallback={routeLoading}><SearchResultsPage /></React.Suspense>} />
        <Route path="/community/:communityName" element={<React.Suspense fallback={routeLoading}><CommunityDetailPage /></React.Suspense>} />
        <Route path="/c/:communityName" element={<React.Suspense fallback={routeLoading}><CommunityDetailPage /></React.Suspense>} />
        <Route path="/post/:postId" element={<React.Suspense fallback={routeLoading}><PostDetailPage /></React.Suspense>} />
        <Route path="/user/:username" element={<React.Suspense fallback={routeLoading}><UserProfilePage /></React.Suspense>} />
        <Route path="/u/:username" element={<React.Suspense fallback={routeLoading}><UserProfilePage /></React.Suspense>} />

        <Route element={<ProtectedRoute />}>
          {/* Authenticated User Pages */}
          <Route path="/notifications" element={<React.Suspense fallback={routeLoading}><NotificationsPage /></React.Suspense>} />
          <Route path="/messages" element={<React.Suspense fallback={routeLoading}><MessagesPage /></React.Suspense>} />
          <Route path="/saved" element={<React.Suspense fallback={routeLoading}><SavedPostsPage /></React.Suspense>} />

          {/* Community Management */}
          <Route path="/communities/create" element={<React.Suspense fallback={routeLoading}><CreateCommunityPage /></React.Suspense>} />
          <Route path="/communities/mine" element={<React.Suspense fallback={routeLoading}><MyCommunitiesPage /></React.Suspense>} />
          <Route path="/community/:communityName/settings" element={<React.Suspense fallback={routeLoading}><EditCommunityPage /></React.Suspense>} />
          <Route path="/community/:communityName/members" element={<React.Suspense fallback={routeLoading}><CommunityMembersPage /></React.Suspense>} />
          <Route path="/community/:communityName/moderation" element={<React.Suspense fallback={routeLoading}><CommunityModerationPage /></React.Suspense>} />
          <Route path="/c/:communityName/settings" element={<React.Suspense fallback={routeLoading}><EditCommunityPage /></React.Suspense>} />
          <Route path="/c/:communityName/members" element={<React.Suspense fallback={routeLoading}><CommunityMembersPage /></React.Suspense>} />
          <Route path="/c/:communityName/moderation" element={<React.Suspense fallback={routeLoading}><CommunityModerationPage /></React.Suspense>} />

          {/* Settings Hub Nested Routes */}
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<React.Suspense fallback={routeLoading}><GeneralSettingsPage /></React.Suspense>} />
            <Route path="profile" element={<React.Suspense fallback={routeLoading}><EditProfilePage /></React.Suspense>} />
            <Route path="account" element={<React.Suspense fallback={routeLoading}><AccountSettingsPage /></React.Suspense>} />
            <Route path="privacy" element={<React.Suspense fallback={routeLoading}><PrivacySettingsPage /></React.Suspense>} />
            <Route path="appearance" element={<React.Suspense fallback={routeLoading}><AppearanceSettingsPage /></React.Suspense>} />
            <Route path="notifications" element={<React.Suspense fallback={routeLoading}><NotificationSettingsPage /></React.Suspense>} />
          </Route>
        </Route>

        {/* Error pages within standard layout */}
        <Route path="/403" element={<React.Suspense fallback={routeLoading}><AccessDeniedPage /></React.Suspense>} />
        <Route path="/404" element={<React.Suspense fallback={routeLoading}><NotFoundPage /></React.Suspense>} />
      </Route>

      {/* 2. AUTHENTICATION PAGES (SPLIT-SCREEN, NO APP SIDEBAR) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<React.Suspense fallback={routeLoading}><LoginPage /></React.Suspense>} />
        <Route path="/register" element={<React.Suspense fallback={routeLoading}><RegisterPage /></React.Suspense>} />
        <Route path="/verify-email" element={<React.Suspense fallback={routeLoading}><VerifyEmailPage /></React.Suspense>} />
        <Route path="/forgot-password" element={<React.Suspense fallback={routeLoading}><ForgotPasswordPage /></React.Suspense>} />
        <Route path="/reset-password" element={<React.Suspense fallback={routeLoading}><ResetPasswordPage /></React.Suspense>} />
        <Route path="/terms" element={<React.Suspense fallback={routeLoading}><TermsOfUsePage /></React.Suspense>} />
      </Route>

      {/* 3. ADMIN PORTAL (ADMIN SIDEBAR & RESTRICTED ACCESS) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<React.Suspense fallback={routeLoading}><AdminDashboardPage /></React.Suspense>} />
        <Route path="users" element={<React.Suspense fallback={routeLoading}><UserManagementPage /></React.Suspense>} />
        <Route path="communities" element={<React.Suspense fallback={routeLoading}><CommunityManagementPage /></React.Suspense>} />
        <Route path="reports" element={<React.Suspense fallback={routeLoading}><ReportManagementPage /></React.Suspense>} />
      </Route>

      {/* 4. WILDCARD FALLBACK */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
