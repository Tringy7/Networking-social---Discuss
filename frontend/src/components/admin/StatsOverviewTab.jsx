import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { usePost } from '../../context/PostContext';
import { formatNumber } from '../../utils/formatters';
import { Users, LayoutGrid, FileText, Flag, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';

export default function StatsOverviewTab({ onSwitchTab }) {
  const { allUsers } = useAuth();
  const { communities } = useCommunity();
  const { posts, reports } = usePost();

  const totalUsers = allUsers.length;
  const lockedUsers = allUsers.filter(u => u.status === 'LOCKED').length;
  const totalCommunities = communities.length;
  const totalPosts = posts.length;
  const pendingReports = reports.filter(r => r.status === 'PENDING').length;

  const statCards = [
    {
      title: 'Tổng Người Dùng',
      value: formatNumber(totalUsers),
      subtext: `${lockedUsers} tài khoản đang bị khóa`,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600',
      tab: 'users',
    },
    {
      title: 'Tổng Cộng Đồng',
      value: formatNumber(totalCommunities),
      subtext: 'Đang hoạt động sôi nổi',
      icon: LayoutGrid,
      color: 'bg-purple-500/10 text-purple-600',
      tab: 'communities',
    },
    {
      title: 'Bài Thảo Luận',
      value: formatNumber(totalPosts),
      subtext: 'Trên toàn hệ thống',
      icon: FileText,
      color: 'bg-emerald-500/10 text-emerald-600',
      tab: null,
    },
    {
      title: 'Báo Cáo Chờ Xử Lý',
      value: formatNumber(pendingReports),
      subtext: pendingReports > 0 ? 'Cần ban quản trị kiểm tra' : 'Hệ thống an toàn',
      icon: Flag,
      color: pendingReports > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-500/10 text-slate-600',
      tab: 'reports',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => card.tab && onSwitchTab(card.tab)}
              className={`p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-all ${
                card.tab ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                {card.value}
              </div>
              <div className="text-xs text-slate-500">
                {card.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* System Health & Info banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Trung tâm Kiểm duyệt & Bảo mật Discuss</span>
          </div>
          <h3 className="text-lg font-bold">Trạng thái vận hành hệ thống</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Theo dõi người dùng, cộng đồng và nội dung vi phạm toàn hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingReports > 0 ? (
            <button
              onClick={() => onSwitchTab('reports')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Xử lý {pendingReports} vi phạm</span>
            </button>
          ) : (
            <span className="text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Hệ thống ổn định
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
