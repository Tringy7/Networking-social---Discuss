import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import PostComposerModal from '../components/post/PostComposerModal';
import MobileNavigation from '../components/layout/MobileNavigation';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col antialiased transition-colors duration-200">
      <a href="#main-content" className="skip-link">Bỏ qua điều hướng, đến nội dung</a>
      <Navbar />
      <div className="flex-1 flex max-w-screen-2xl w-full mx-auto">
        <Sidebar />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 p-4 pb-24 sm:p-5 sm:pb-24 lg:p-6 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
      <PostComposerModal />
    </div>
  );
};

export default AppLayout;
