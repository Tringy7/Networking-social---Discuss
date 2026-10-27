import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReportStore } from '../../store/useReportStore';
import { useToastStore } from '../../store/useToastStore';
import { AdminStats, adminService } from '../../services';
import Button from '../../components/ui/Button';
import {
  Users,
  FolderKanban,
  FileText,
  ShieldAlert,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const AdminDashboardPage: React.FC = () => {
  const { reports, hydrate: hydrateReports } = useReportStore();
  const addToast = useToastStore((state) => state.addToast);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPosts: 0,
    activeCommunities: 0,
    pendingReports: 0,
    userGrowth: [],
  });

  useEffect(() => {
    adminService.getStats().then(setStats).catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải thống kê quản trị.', 'error');
    });
    hydrateReports().catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải báo cáo.', 'error');
    });
  }, [addToast, hydrateReports]);

  const pendingReportsCount = stats.pendingReports;

  const statCards = [
    {
      label: 'Tổng người dùng',
      value: stats.totalUsers.toLocaleString('vi-VN'),
      change: 'Tổng số tài khoản',
      icon: <Users className="w-5 h-5 text-[#FF5700]" />,
    },
    {
      label: 'Cộng đồng hoạt động',
      value: stats.activeCommunities.toString(),
      change: 'Đang hoạt động',
      icon: <FolderKanban className="w-5 h-5 text-[#3B82F6]" />,
    },
    {
      label: 'Tổng bài viết & thảo luận',
      value: stats.totalPosts.toLocaleString('vi-VN'),
      change: 'Đang hiển thị',
      icon: <FileText className="w-5 h-5 text-[#22C55E]" />,
    },
    {
      label: 'Báo cáo vi phạm chờ xử lý',
      value: pendingReportsCount.toString(),
      change: pendingReportsCount > 0 ? 'Cần duyệt sớm' : 'Đã giải quyết hết',
      icon: <ShieldAlert className="w-5 h-5 text-[#EF4444]" />,
    },
  ];

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#EF4444]" />
            <span>Bảng điều khiển Quản trị hệ thống (Admin)</span>
          </h1>
          <p className="text-xs text-[#9A9DA3] mt-0.5">
            Giám sát số liệu tăng trưởng, kiểm duyệt vi phạm và quản lý toàn bộ hệ thống DISCUSS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/reports">
            <Button variant="danger" size="sm" leftIcon={<ShieldAlert className="w-4 h-4" />}>
              Xử lý báo cáo ({pendingReportsCount})
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#191A1C] border border-[#303235] space-y-3 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#9A9DA3]">{card.label}</span>
              <div className="p-2 rounded-xl bg-[#222426] border border-[#303235]">{card.icon}</div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#F5F5F5] tracking-tight tabular-nums">
                {card.value}
              </div>
              <div className="text-[11px] text-[#22C55E] flex items-center gap-1 mt-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{card.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#191A1C] border border-[#303235] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF5700]" />
                <span>Tăng trưởng người dùng (6 tháng qua)</span>
              </h3>
              <p className="text-xs text-[#70747C]">Số tài khoản đăng ký mới theo tháng</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5700" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF5700" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#303235" vertical={false} />
                <XAxis dataKey="month" stroke="#70747C" fontSize={11} tickLine={false} />
                <YAxis stroke="#70747C" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#191A1C',
                    borderColor: '#303235',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F5F5F5',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="Người dùng"
                  stroke="#FF5700"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#userGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Log (1 Col) */}
        <div className="p-6 rounded-3xl bg-[#191A1C] border border-[#303235] space-y-4 shadow-xl text-left">
          <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#3B82F6]" />
            <span>Nhật ký hoạt động hệ thống</span>
          </h3>

          <div className="space-y-3">
            {reports.slice(0, 4).map((report) => (
              <div key={report.id} className="p-2.5 rounded-xl bg-[#141517] border border-[#303235] text-xs space-y-1">
                <div className="text-[11px] text-[#70747C]">
                  {new Date(report.createdAt).toLocaleString('vi-VN')}
                </div>
                <div className="text-[#D1D5DB] leading-snug">
                  Báo cáo {report.contentType.toLowerCase()} bởi @{report.reporterUsername} · {report.status}
                </div>
              </div>
            ))}
            {reports.length === 0 && <p className="text-xs text-[#70747C]">Chưa có hoạt động báo cáo.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
