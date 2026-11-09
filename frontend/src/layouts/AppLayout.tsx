import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import PostComposerModal from '../components/post/PostComposerModal';
import MobileNavigation from '../components/layout/MobileNavigation';
import PageTransition from '../components/layout/PageTransition';

export const AppLayout: React.FC = () => {
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
