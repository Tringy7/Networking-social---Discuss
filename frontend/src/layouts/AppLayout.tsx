import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { useCommunityStore } from '../store/useCommunityStore';
import { usePostStore } from '../store/usePostStore';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import PostComposerModal from '../components/post/PostComposerModal';
import MobileNavigation from '../components/layout/MobileNavigation';
import PageTransition from '../components/layout/PageTransition';

export const AppLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const account = useAuthStore((state) => state.user?.username);
  const hydrateCommunities = useCommunityStore((state) => state.hydrate);
  const hydrateMyCommunities = useCommunityStore((state) => state.hydrateMine);
  const hydratePosts = usePostStore((state) => state.hydrate);
  const addToast = useToastStore(state => state.addToast);
  React.useEffect(() => {
    usePostStore.getState().reset();
    if (!isAuthenticated) return;

    let active = true;
    hydrateCommunities().catch((error: unknown) => {
      if (active) {
        addToast(
          error instanceof Error ? error.message : 'Không thể tải danh sách cộng đồng.',
          'error'
        );
      }
    });
    if (isAuthenticated) {
      hydrateMyCommunities().catch((error: unknown) => {
        addToast(error instanceof Error ? error.message : 'Không thể tải cộng đồng của bạn.', 'error');
      });
    }
    hydratePosts().catch((error: unknown) => {
      if (active) {
        addToast(error instanceof Error ? error.message : 'Không thể tải bài viết.', 'error');
      }
    });

    return () => {
      active = false;
    };
  }, [addToast, hydrateCommunities, hydrateMyCommunities, hydratePosts, isAuthenticated, account]);

  return (
    <div className="discuss-app min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col antialiased">
      <a href="#main-content" className="skip-link">Bỏ qua điều hướng, đến nội dung</a>
      <Navbar />
      <div className="app-frame">
        <Sidebar />
        <main id="main-content" tabIndex={-1} className="app-canvas">
          <PageTransition><Outlet /></PageTransition>
        </main>
      </div>
      <MobileNavigation />
      <PostComposerModal />
    </div>
  );
};

export default AppLayout;
