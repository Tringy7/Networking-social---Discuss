import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import DevRoleSwitcher from '../components/common/DevRoleSwitcher';
import PostComposerModal from '../components/post/PostComposerModal';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col antialiased transition-colors duration-200">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <PostComposerModal />
      <DevRoleSwitcher />
    </div>
  );
};

export default AppLayout;
