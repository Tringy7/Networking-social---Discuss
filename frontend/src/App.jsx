import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CommunityProvider, useCommunity } from './context/CommunityContext';
import { PostProvider } from './context/PostContext';

import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import RightSidebar from './components/common/RightSidebar';
import ToastContainer from './components/common/ToastContainer';

import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import VerifyEmailModal from './components/auth/VerifyEmailModal';
import ForgotPasswordModal from './components/auth/ForgotPasswordModal';
import EditProfileModal from './components/auth/EditProfileModal';

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

function DiscussMainApp() {
  const { communities } = useCommunity();

  const [currentView, setCurrentView] = useState('home');
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isVerifyEmailOpen, setIsVerifyEmailOpen] = useState(false);
  const [verifyEmailTarget, setVerifyEmailTarget] = useState('');
  const [verifyEmailOtp, setVerifyEmailOtp] = useState('');
  const [prefilledLoginUsername, setPrefilledLoginUsername] = useState('');

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [detailPost, setDetailPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [reportingPost, setReportingPost] = useState(null);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleSelectCommunity = (communityId) => {
    setSelectedCommunityId(communityId);
    setCurrentView('community');
  };

  const handleNavigateHome = () => {
    setSelectedCommunityId(null);
    setCurrentView('home');
  };

  const handleNavigateExplore = () => {
    setCurrentView('explore');
  };

  const handleNavigateAdmin = () => {
    setCurrentView('admin');
  };

  const handleNavigateProfile = () => {
    setCurrentView('profile');
  };

  const handleOpenVerifyEmail = (email = '', otp = '') => {
    setVerifyEmailTarget(email);
    setVerifyEmailOtp(otp);
    setIsVerifyEmailOpen(true);
  };

  const activeCommunity = selectedCommunityId && Array.isArray(communities)
    ? communities.find((c) => c.id === selectedCommunityId)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900">
      <Navbar
        currentView={currentView}
        onOpenLogin={() => {
          setPrefilledLoginUsername('');
          setIsLoginOpen(true);
        }}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenVerifyEmail={(email, otp) => handleOpenVerifyEmail(email, otp)}
        onOpenCreatePost={() => setIsCreatePostOpen(true)}
        onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onNavigateHome={handleNavigateHome}
        onNavigateExplore={handleNavigateExplore}
        onNavigateAdmin={handleNavigateAdmin}
        onNavigateProfile={handleNavigateProfile}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex gap-6">
        <Sidebar
          currentView={currentView}
          selectedCommunityId={selectedCommunityId}
          onNavigateHome={handleNavigateHome}
          onNavigateExplore={handleNavigateExplore}
          onNavigateAdmin={handleNavigateAdmin}
          onNavigateProfile={handleNavigateProfile}
          onSelectCommunity={handleSelectCommunity}
          onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0">
          {currentView === 'home' && (
            <FeedPage
              communityId={null}
              onOpenDetail={(post) => setDetailPost(post)}
              onOpenEdit={(post) => setEditingPost(post)}
              onOpenReport={(post) => setReportingPost(post)}
              onSelectCommunity={handleSelectCommunity}
              onOpenCreatePost={() => setIsCreatePostOpen(true)}
            />
          )}

          {currentView === 'community' && activeCommunity && (
            <CommunityDetailPage
              community={activeCommunity}
              onOpenPostDetail={(post) => setDetailPost(post)}
              onOpenEditPost={(post) => setEditingPost(post)}
              onOpenReportPost={(post) => setReportingPost(post)}
              onSelectCommunity={handleSelectCommunity}
            />
          )}

          {currentView === 'explore' && (
            <ExploreCommunitiesPage
              onSelectCommunity={handleSelectCommunity}
              onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
            />
          )}

          {currentView === 'admin' && (
            <AdminDashboardPage
              onSelectCommunity={handleSelectCommunity}
              onOpenPostDetail={(post) => setDetailPost(post)}
            />
          )}

          {currentView === 'profile' && (
            <UserProfilePage
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              onOpenPostDetail={(post) => setDetailPost(post)}
              onOpenEditPost={(post) => setEditingPost(post)}
              onOpenReportPost={(post) => setReportingPost(post)}
              onSelectCommunity={handleSelectCommunity}
            />
          )}
        </main>

        {currentView !== 'admin' && (
          <RightSidebar
            onSelectCommunity={handleSelectCommunity}
            onSelectTag={() => {
              setCurrentView('home');
            }}
          />
        )}
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
        onOpenVerifyEmail={(email, otp) => handleOpenVerifyEmail(email, otp)}
        prefilledUsername={prefilledLoginUsername}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onOpenLogin={() => {
          setPrefilledLoginUsername('');
          setIsLoginOpen(true);
        }}
        onOpenVerifyEmail={(email, otp) => handleOpenVerifyEmail(email, otp)}
      />

      <VerifyEmailModal
        isOpen={isVerifyEmailOpen}
        onClose={() => setIsVerifyEmailOpen(false)}
        initialEmail={verifyEmailTarget}
        initialOtp={verifyEmailOtp}
        onOpenLogin={(verifiedEmail) => {
          setPrefilledLoginUsername(verifiedEmail);
          setIsLoginOpen(true);
        }}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        defaultCommunityId={selectedCommunityId}
        onCreated={() => {}}
      />

      <CreateCommunityModal
        isOpen={isCreateCommunityOpen}
        onClose={() => setIsCreateCommunityOpen(false)}
        onCreated={(newComm) => handleSelectCommunity(newComm.id)}
      />

      <PostDetailModal
        isOpen={!!detailPost}
        onClose={() => setDetailPost(null)}
        post={detailPost}
        onOpenEdit={(post) => setEditingPost(post)}
        onOpenReport={(post) => setReportingPost(post)}
        onSelectCommunity={handleSelectCommunity}
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

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CommunityProvider>
          <PostProvider>
            <DiscussMainApp />
          </PostProvider>
        </CommunityProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
