import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CommunityProvider, useCommunity } from './context/CommunityContext';
import { PostProvider } from './context/PostContext';

import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import RightSidebar from './components/common/RightSidebar';
import UserProfileRightSidebar from './components/common/UserProfileRightSidebar';
import ToastContainer from './components/common/ToastContainer';

import VerifyEmailModal from './components/auth/VerifyEmailModal';
import ForgotPasswordModal from './components/auth/ForgotPasswordModal';
import ChangePasswordModal from './components/auth/ChangePasswordModal';

import PostDetailModal from './components/post/PostDetailModal';
import CreatePostModal from './components/post/CreatePostModal';
import EditPostModal from './components/post/EditPostModal';
import ReportPostModal from './components/post/ReportPostModal';

import CreateCommunityModal from './components/community/CreateCommunityModal';

import FeedPage from './pages/FeedPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import ExploreCommunitiesPage from './pages/ExploreCommunitiesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserProfilePage from './pages/UserProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/common/ProtectedRoute';

/**
 * Layout chung có Navbar, Sidebar và RightSidebar
 */
function MainLayout({
  onOpenCreatePost,
  onOpenCreateCommunity,
  onOpenVerifyEmail,
  children,
  showRightSidebar = true,
  rightSidebar = null,
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#0e1113] text-[#d7dadc]">
      <Navbar
        onOpenCreatePost={onOpenCreatePost}
        onOpenVerifyEmail={onOpenVerifyEmail}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Container: Sidebar flush against left edge */}
      <div className="flex-1 flex w-full">
        <Sidebar
          onOpenCreateCommunity={onOpenCreateCommunity}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Center Content & Optional RightSidebar */}
        <div className="flex-1 min-w-0 flex justify-center py-5 px-3 sm:px-6">
          <div className="w-full max-w-6xl flex gap-6">
            <main className="flex-1 min-w-0">
              {children}
            </main>

            {showRightSidebar && (
              rightSidebar ? (
                rightSidebar
              ) : (
                <RightSidebar
                  onSelectCommunity={(commId) => navigate(`/c/${commId}`)}
                  onSelectTag={() => navigate('/')}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscussAppRoutes() {
  const navigate = useNavigate();
  const { communities } = useCommunity();

  // Modals toàn cục
  const [isVerifyEmailOpen, setIsVerifyEmailOpen] = useState(false);
  const [verifyEmailTarget, setVerifyEmailTarget] = useState('');
  const [verifyEmailOtp, setVerifyEmailOtp] = useState('');

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [createPostCommunityId, setCreatePostCommunityId] = useState(null);

  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [detailPost, setDetailPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [reportingPost, setReportingPost] = useState(null);

  // Active Profile User data for UserProfileRightSidebar
  const [activeProfileData, setActiveProfileData] = useState(null);

  const handleOpenVerifyEmail = (email = '', otp = '') => {
    setVerifyEmailTarget(email);
    setVerifyEmailOtp(otp);
    setIsVerifyEmailOpen(true);
  };

  const handleOpenCreatePost = (communityId = null) => {
    setCreatePostCommunityId(communityId);
    setIsCreatePostOpen(true);
  };

  return (
    <>
      <Routes>
        {/* Auth Dedicated Pages */}
        <Route 
          path="/login" 
          element={
            <LoginPage
              onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
              onOpenVerifyEmail={handleOpenVerifyEmail}
            />
          } 
        />
        <Route 
          path="/register" 
          element={
            <RegisterPage
              onOpenVerifyEmail={handleOpenVerifyEmail}
            />
          } 
        />

        {/* Home Feed */}
        <Route
          path="/"
          element={
            <MainLayout
              onOpenCreatePost={() => handleOpenCreatePost(null)}
              onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
              onOpenVerifyEmail={handleOpenVerifyEmail}
            >
              <FeedPage
                communityId={null}
                onOpenDetail={(post) => setDetailPost(post)}
                onOpenEdit={(post) => setEditingPost(post)}
                onOpenReport={(post) => setReportingPost(post)}
                onSelectCommunity={(commId) => navigate(`/c/${commId}`)}
                onSelectUser={(userId) => navigate(`/user/${userId}`)}
                onOpenCreatePost={() => handleOpenCreatePost(null)}
              />
            </MainLayout>
          }
        />

        {/* Explore Communities */}
        <Route
          path="/explore"
          element={
            <MainLayout
              onOpenCreatePost={() => handleOpenCreatePost(null)}
              onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
              onOpenVerifyEmail={handleOpenVerifyEmail}
            >
              <ExploreCommunitiesPage
                onSelectCommunity={(commId) => navigate(`/c/${commId}`)}
                onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
              />
            </MainLayout>
          }
        />

        {/* Community Detail: /c/:communityId */}
        <Route
          path="/c/:communityId"
          element={
            <MainLayout
              onOpenCreatePost={() => handleOpenCreatePost(null)}
              onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
              onOpenVerifyEmail={handleOpenVerifyEmail}
            >
              <CommunityDetailPage
                onOpenPostDetail={(post) => setDetailPost(post)}
                onOpenEditPost={(post) => setEditingPost(post)}
                onOpenReportPost={(post) => setReportingPost(post)}
                onSelectCommunity={(commId) => navigate(`/c/${commId}`)}
                onSelectUser={(userId) => navigate(`/user/${userId}`)}
              />
            </MainLayout>
          }
        />

        {/* Current User Profile: /user (Yêu cầu đăng nhập, nếu chưa đăng nhập điều hướng sang /login theo chuẩn 401) */}
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <MainLayout
                onOpenCreatePost={() => handleOpenCreatePost(null)}
                onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
                onOpenVerifyEmail={handleOpenVerifyEmail}
                rightSidebar={
                  activeProfileData?.targetUser ? (
                    <UserProfileRightSidebar
                      targetUser={activeProfileData.targetUser}
                      isMe={activeProfileData.isMe}
                      userPostsCount={activeProfileData.userPostsCount}
                      userCommunitiesCount={activeProfileData.userCommunitiesCount}
                      onOpenEditProfile={() => navigate('/user/edit')}
                    />
                  ) : null
                }
              >
                <UserProfilePage
                  onOpenEditProfile={() => navigate('/user/edit')}
                  onOpenPostDetail={(post) => setDetailPost(post)}
                  onOpenEditPost={(post) => setEditingPost(post)}
                  onOpenReportPost={(post) => setReportingPost(post)}
                  onSelectCommunity={(commId) => navigate(`/c/${commId}`)}
                  onBack={() => navigate('/')}
                  onUserDataLoaded={(data) => setActiveProfileData(data)}
                />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Public User Profile: /user/:userId (Công khai xem thông tin người khác) */}
        <Route
          path="/user/:userId"
          element={
            <MainLayout
              onOpenCreatePost={() => handleOpenCreatePost(null)}
              onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
              onOpenVerifyEmail={handleOpenVerifyEmail}
              rightSidebar={
                activeProfileData?.targetUser ? (
                  <UserProfileRightSidebar
                    targetUser={activeProfileData.targetUser}
                    isMe={activeProfileData.isMe}
                    userPostsCount={activeProfileData.userPostsCount}
                    userCommunitiesCount={activeProfileData.userCommunitiesCount}
                    onOpenEditProfile={() => navigate('/user/edit')}
                  />
                ) : null
              }
            >
              <UserProfilePage
                onOpenEditProfile={() => navigate('/user/edit')}
                onOpenPostDetail={(post) => setDetailPost(post)}
                onOpenEditPost={(post) => setEditingPost(post)}
                onOpenReportPost={(post) => setReportingPost(post)}
                onSelectCommunity={(commId) => navigate(`/c/${commId}`)}
                onBack={() => navigate(-1)}
                onUserDataLoaded={(data) => setActiveProfileData(data)}
              />
            </MainLayout>
          }
        />

        {/* Edit Profile: /user/edit (Yêu cầu đăng nhập) */}
        <Route
          path="/user/edit"
          element={
            <ProtectedRoute>
              <MainLayout
                onOpenCreatePost={() => handleOpenCreatePost(null)}
                onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
                onOpenVerifyEmail={handleOpenVerifyEmail}
              >
                <EditProfilePage
                  onBack={() => navigate('/user')}
                  onOpenChangePassword={() => setIsChangePasswordOpen(true)}
                />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard: /admin */}
        <Route
          path="/admin"
          element={
            <MainLayout
              onOpenCreatePost={() => handleOpenCreatePost(null)}
              onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
              onOpenVerifyEmail={handleOpenVerifyEmail}
              showRightSidebar={false}
            >
              <AdminDashboardPage
                onSelectCommunity={(commId) => navigate(`/c/${commId}`)}
                onOpenPostDetail={(post) => setDetailPost(post)}
              />
            </MainLayout>
          }
        />

        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Modals */}
      <VerifyEmailModal
        isOpen={isVerifyEmailOpen}
        onClose={() => setIsVerifyEmailOpen(false)}
        initialEmail={verifyEmailTarget}
        initialOtp={verifyEmailOtp}
        onOpenLogin={() => navigate('/login')}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onOpenLogin={() => navigate('/login')}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        defaultCommunityId={createPostCommunityId}
        onCreated={() => {}}
      />

      <CreateCommunityModal
        isOpen={isCreateCommunityOpen}
        onClose={() => setIsCreateCommunityOpen(false)}
        onCreated={(newComm) => navigate(`/c/${newComm.slug || newComm.id}`)}
      />

      <PostDetailModal
        isOpen={!!detailPost}
        onClose={() => setDetailPost(null)}
        post={detailPost}
        onOpenEdit={(post) => setEditingPost(post)}
        onOpenReport={(post) => setReportingPost(post)}
        onSelectCommunity={(commId) => navigate(`/c/${commId}`)}
        onSelectUser={(userId) => navigate(`/user/${userId}`)}
      />

      <EditPostModal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        post={editingPost}
      />

      <ReportPostModal
        isOpen={!!reportingPost}
        onClose={() => setReportingPost(null)}
        post={reportingPost}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CommunityProvider>
            <PostProvider>
              <DiscussAppRoutes />
              <ToastContainer />
            </PostProvider>
          </CommunityProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
