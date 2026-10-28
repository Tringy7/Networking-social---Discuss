import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import SettingsLayout from '../layouts/SettingsLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/common/StoreProtectedRoute';

// Public & Feed Pages
import HomePage from '../pages/home/HomePage';
import ExplorePage from '../pages/explore/ExplorePage';
import SearchResultsPage from '../pages/search/SearchResultsPage';
import CommunityDetailPage from '../pages/community/CommunityDetailPage';
import PostDetailPage from '../pages/post/PostDetailPage';
import UserProfilePage from '../pages/profile/UserProfilePage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import TermsOfUsePage from '../pages/auth/TermsOfUsePage';

// Authenticated Pages
import NotificationsPage from '../pages/notifications/NotificationsPage';
import MessagesPage from '../pages/messages/MessagesPage';
import SavedPostsPage from '../pages/saved/SavedPostsPage';

// Settings Pages
import GeneralSettingsPage from '../pages/settings/GeneralSettingsPage';
import EditProfilePage from '../pages/settings/EditProfilePage';
import AccountSettingsPage from '../pages/settings/AccountSettingsPage';
import PrivacySettingsPage from '../pages/settings/PrivacySettingsPage';
import AppearanceSettingsPage from '../pages/settings/AppearanceSettingsPage';
import NotificationSettingsPage from '../pages/settings/NotificationSettingsPage';

// Community Management Pages
import CreateCommunityPage from '../pages/community/CreateCommunityPage';
import MyCommunitiesPage from '../pages/community/MyCommunitiesPage';
import EditCommunityPage from '../pages/community/EditCommunityPage';
import CommunityMembersPage from '../pages/community/CommunityMembersPage';
import CommunityModerationPage from '../pages/community/CommunityModerationPage';

// Admin Pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import CommunityManagementPage from '../pages/admin/CommunityManagementPage';
import ReportManagementPage from '../pages/admin/ReportManagementPage';

// Error Pages
import AccessDeniedPage from '../pages/error/AccessDeniedPage';
import NotFoundPage from '../pages/error/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. MAIN APP SHELL (WITH NAVBAR & SIDEBAR) */}
      <Route element={<AppLayout />}>
        {/* Core Feeds */}
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/c/:communityName" element={<CommunityDetailPage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
        <Route path="/u/:username" element={<UserProfilePage />} />

        <Route element={<ProtectedRoute />}>
          {/* Authenticated User Pages */}
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/saved" element={<SavedPostsPage />} />

          {/* Community Management */}
          <Route path="/communities/create" element={<CreateCommunityPage />} />
          <Route path="/communities/mine" element={<MyCommunitiesPage />} />
          <Route path="/c/:communityName/settings" element={<EditCommunityPage />} />
          <Route path="/c/:communityName/members" element={<CommunityMembersPage />} />
          <Route path="/c/:communityName/moderation" element={<CommunityModerationPage />} />

          {/* Settings Hub Nested Routes */}
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<GeneralSettingsPage />} />
            <Route path="profile" element={<EditProfilePage />} />
            <Route path="account" element={<AccountSettingsPage />} />
            <Route path="privacy" element={<PrivacySettingsPage />} />
            <Route path="appearance" element={<AppearanceSettingsPage />} />
            <Route path="notifications" element={<NotificationSettingsPage />} />
          </Route>
        </Route>

        {/* Error pages within standard layout */}
        <Route path="/403" element={<AccessDeniedPage />} />
        <Route path="/404" element={<NotFoundPage />} />
      </Route>

      {/* 2. AUTHENTICATION PAGES (SPLIT-SCREEN, NO APP SIDEBAR) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/terms" element={<TermsOfUsePage />} />
      </Route>

      {/* 3. ADMIN PORTAL (ADMIN SIDEBAR & RESTRICTED ACCESS) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="communities" element={<CommunityManagementPage />} />
        <Route path="reports" element={<ReportManagementPage />} />
      </Route>

      {/* 4. WILDCARD FALLBACK */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
