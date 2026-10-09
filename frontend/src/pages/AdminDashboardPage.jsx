import React, { useState } from 'react';
import StatsOverviewTab from '../components/admin/StatsOverviewTab';
import UserManagementTab from '../components/admin/UserManagementTab';
import CommunityManagementTab from '../components/admin/CommunityManagementTab';
import SystemReportsTab from '../components/admin/SystemReportsTab';
import { useAuth } from '../context/AuthContext';
import { SYSTEM_ROLES } from '../constants/roles';
import { permissions } from '../utils/permissions';
import { ShieldAlert, Users, LayoutGrid, Flag, BarChart2, ShieldCheck, Lock } from 'lucide-react';

export default function AdminDashboardPage({ onSelectCommunity, onOpenPostDetail }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');

  const isAdmin = permissions.isAdmin(currentUser);

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Yêu cầu quyền Quản trị viên</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Khu vực này chỉ dành riêng cho Quản trị viên toàn hệ thống Discuss. Tài khoản hiện tại của bạn không có quyền truy cập.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'stats', label: 'Tổng quan & Thống kê', icon: BarChart2 },
    { id: 'users', label: 'Quản lý Người dùng', icon: Users },
    { id: 'communities', label: 'Quản lý Cộng đồng', icon: LayoutGrid },
    { id: 'reports', label: 'Báo cáo vi phạm', icon: Flag },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Khu vực Quản trị Hệ thống (Admin Portal)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản trị viên Discuss
          </h1>
        </div>

        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Quyền: Toàn quyền Hệ thống
        </span>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'stats' && (
          <StatsOverviewTab onSwitchTab={(tabId) => setActiveTab(tabId)} />
        )}

        {activeTab === 'users' && (
          <UserManagementTab />
        )}

        {activeTab === 'communities' && (
          <CommunityManagementTab onSelectCommunity={onSelectCommunity} />
        )}

        {activeTab === 'reports' && (
          <SystemReportsTab onOpenPostDetail={onOpenPostDetail} />
        )}
      </div>
    </div>
  );
}
