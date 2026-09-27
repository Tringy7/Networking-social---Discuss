/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PostCard } from './components/PostCard';
import { CommunityView } from './components/CommunityView';
import { PostDetailModal } from './components/PostDetailModal';
import { CreatePostModal } from './components/CreatePostModal';
import { CreateCommunityModal } from './components/CreateCommunityModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AuthModals } from './components/AuthModals';
import { UserProfileModal } from './components/UserProfileModal';
import { ReportPostModal } from './components/ReportPostModal';
import {
  Flame,
  Sparkles,
  TrendingUp,
  Plus,
  Search,
  X,
  FileQuestion,
  Users,
  Compass,
  ArrowRight,
} from 'lucide-react';

const MainFeed: React.FC<{ onReportPost: (postId: string) => void }> = ({ onReportPost }) => {
  const {
    posts,
    communities,
    selectedCommunityId,
    searchQuery,
    setSearchQuery,
    sortFilter,
    setSortFilter,
    currentUser,
    setIsCreatePostOpen,
    setIsAuthModalOpen,
    setActivePostId,
    setSelectedCommunityId,
  } = useApp();

  // If a community is selected, render CommunityView
  const currentComm = communities.find((c) => c.id === selectedCommunityId && !c.isDeleted);
  if (currentComm) {
    return <CommunityView community={currentComm} onOpenReportPost={onReportPost} />;
  }

  // Filter posts for Home Feed
  let filteredPosts = posts.filter((p) => {
    if (p.isDeleted) return false;
    const comm = communities.find((c) => c.id === p.communityId);
    if (!comm || comm.isDeleted) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchContent = p.content.toLowerCase().includes(q);
      return matchTitle || matchContent;
    }
    return true;
  });

  // Sorting
  if (sortFilter === 'new') {
    filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortFilter === 'top') {
    // top score
    filteredPosts.sort((a, b) => (b.id === 'post-1' ? 1 : -1));
  } else {
    // Hot: pinned first, then newest
    filteredPosts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  return (
    <div className="space-y-4">
      {/* Search status notification */}
      {searchQuery && (
        <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Search className="w-4 h-4 text-orange-600" />
            <span>
              Kết quả tìm kiếm cho từ khóa: <strong>&quot;{searchQuery}&quot;</strong> ({filteredPosts.length} bài viết)
            </span>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Quick Create Post Banner */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex items-center gap-3">
        <img
          src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
          alt="Avatar"
          className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
        />
        <button
          id="quick-create-post-input"
          onClick={() => {
            if (!currentUser) setIsAuthModalOpen(true);
            else setIsCreatePostOpen(true);
          }}
          className="flex-1 text-left px-4 py-2 bg-slate-100 hover:bg-slate-200/70 text-slate-500 rounded-full text-xs sm:text-sm transition cursor-pointer"
        >
          {currentUser ? 'Bạn đang nghĩ gì? Tạo bài viết thảo luận...' : 'Đăng nhập để đăng bài viết vào cộng đồng...'}
        </button>
        <button
          onClick={() => {
            if (!currentUser) setIsAuthModalOpen(true);
            else setIsCreatePostOpen(true);
          }}
          className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition shrink-0 cursor-pointer"
          title="Tạo bài viết mới"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Filter / Sort bar on Mobile & Desktop */}
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSortFilter('hot')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              sortFilter === 'hot'
                ? 'bg-orange-50 text-orange-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Thịnh hành</span>
          </button>
          <button
            onClick={() => setSortFilter('new')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              sortFilter === 'new'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Mới nhất</span>
          </button>
          <button
            onClick={() => setSortFilter('top')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              sortFilter === 'top'
                ? 'bg-amber-50 text-amber-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span>Top Vote</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium px-2 hidden sm:inline">
          Hiển thị {filteredPosts.length} bài viết
        </span>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
            <FileQuestion className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy bài viết nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Thử tìm kiếm với từ khóa khác hoặc tạo bài viết đầu tiên cho cộng đồng bạn yêu thích.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenDetail={() => setActivePostId(post.id)}
              onOpenReport={() => onReportPost(post.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const {
    activePostId,
    setActivePostId,
    isCreatePostOpen,
    setIsCreatePostOpen,
    isCreateCommunityOpen,
    setIsCreateCommunityOpen,
    isAdminDashboardOpen,
    setIsAdminDashboardOpen,
    communities,
    setSelectedCommunityId,
  } = useApp();

  const [reportingPostId, setReportingPostId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Navigation Header */}
      <Navbar />

      {/* 2. Main Container */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-5 flex-1">
        <div className="flex gap-6 items-start">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Center Main Stream */}
          <div className="flex-1 min-w-0">
            <MainFeed onReportPost={(postId) => setReportingPostId(postId)} />
          </div>

          {/* Right Column: Trending Communities & Guidelines Widget (Desktop) */}
          <div className="w-72 shrink-0 hidden lg:block space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-orange-600" />
                <span>Cộng đồng nổi bật</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                {communities
                  .filter((c) => !c.isDeleted)
                  .map((comm) => (
                    <button
                      key={comm.id}
                      onClick={() => setSelectedCommunityId(comm.id)}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-xl">{comm.icon}</span>
                        <div className="truncate text-left">
                          <p className="font-bold text-slate-800 group-hover:text-orange-600 transition truncate">
                            {comm.name}
                          </p>
                          <p className="text-[10px] text-slate-400">c/{comm.slug}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-600 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  ))}
              </div>
            </div>

            {/* About Discuss & Community Guidelines Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
                  D
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Về Discuss</h4>
                  <p className="text-[10px] text-slate-400">Mạng xã hội thảo luận cộng đồng</p>
                </div>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Chào mừng bạn đến với Discuss! Không gian kết nối, chia sẻ góc nhìn và thảo luận chuyên sâu theo từng chủ đề yêu thích.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Tự do trao đổi văn minh, tích cực</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span>Bình luận phân cấp nhiều tầng</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Bình chọn xếp hạng công bằng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {/* 1. Post Detail Modal (Nested Comment Tree) */}
      {activePostId && (
        <PostDetailModal
          postId={activePostId}
          onClose={() => setActivePostId(null)}
          onOpenReport={(postId) => setReportingPostId(postId)}
        />
      )}

      {/* 2. Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />

      {/* 3. Create Community Modal */}
      <CreateCommunityModal
        isOpen={isCreateCommunityOpen}
        onClose={() => setIsCreateCommunityOpen(false)}
      />

      {/* 4. Admin Dashboard Modal */}
      <AdminDashboardModal
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
      />

      {/* 5. Auth Modals (Login, Register, Forgot Password) */}
      <AuthModals />

      {/* 6. User Profile Modal */}
      <UserProfileModal />

      {/* 7. Report Post Modal */}
      <ReportPostModal
        postId={reportingPostId}
        onClose={() => setReportingPostId(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
