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
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsLoadFailed, setStatsLoadFailed] = useState(false);
  const [statsRetry, setStatsRetry] = useState(0);

  useEffect(() => {
    let active = true;
    adminService.getStats()
      .then((nextStats) => { if (active) setStats(nextStats); })
      .catch((error: unknown) => {
        if (!active) return;
        setStatsLoadFailed(true);
        addToast(error instanceof Error ? error.message : 'Không thể tải thống kê quản trị.', 'error');
      })
      .finally(() => { if (active) setIsStatsLoading(false); });
    hydrateReports().catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải báo cáo.', 'error');
    });
    return () => { active = false; };
  }, [addToast, hydrateReports, statsRetry]);

  const pendingReportsCount = stats.pendingReports;

  const statCards = [
    {
      label: 'Tổng người dùng',
      value: isStatsLoading || statsLoadFailed ? '—' : stats.totalUsers.toLocaleString('vi-VN'),
      change: 'Tổng số tài khoản',
      icon: <Users className="w-5 h-5 text-[#FF5700]" />,
    },
    {
      label: 'Cộng đồng hoạt động',
      value: isStatsLoading || statsLoadFailed ? '—' : stats.activeCommunities.toString(),
      change: 'Đang hoạt động',
      icon: <FolderKanban className="w-5 h-5 text-[var(--color-info)]" />,
    },
    {
      label: 'Tổng bài viết & thảo luận',
      value: isStatsLoading || statsLoadFailed ? '—' : stats.totalPosts.toLocaleString('vi-VN'),
      change: 'Đang hiển thị',
      icon: <FileText className="w-5 h-5 text-[var(--color-success)]" />,
    },
    {
      label: 'Báo cáo vi phạm chờ xử lý',
      value: isStatsLoading || statsLoadFailed ? '—' : pendingReportsCount.toString(),
      change: pendingReportsCount > 0 ? 'Cần duyệt sớm' : 'Đã giải quyết hết',
      icon: <ShieldAlert className="w-5 h-5 text-[var(--color-danger)]" />,
    },
  ];

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[var(--color-danger)]" />
            <span>Bảng điều khiển Quản trị hệ thống (Admin)</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
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

      {isStatsLoading && <p role="status" className="text-sm text-[var(--text-secondary)]">Đang tải thống kê quản trị…</p>}
      {statsLoadFailed && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-3">
          <span className="text-sm text-[var(--text-secondary)]">Không thể tải thống kê quản trị.</span>
          <Button variant="secondary" size="sm" onClick={() => { setIsStatsLoading(true); setStatsLoadFailed(false); setStatsRetry((count) => count + 1); }}>Thử lại</Button>
        </div>
      )}

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#9A9DA3]">{card.label}</span>
              <div className="rounded-lg bg-[var(--bg-elevated)] p-2">{card.icon}</div>
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">
                {card.value}
              </div>
              <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-1 font-medium">
                <span>{card.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Chart (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--color-orange-ink)]" />
                <span>Tăng trưởng người dùng (6 tháng qua)</span>
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">Số tài khoản đăng ký mới theo tháng</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {isStatsLoading ? (
              <div role="status" className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">Đang tải dữ liệu tăng trưởng…</div>
            ) : statsLoadFailed ? null : stats.userGrowth.length === 0 ? (
              <div role="status" className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">Chưa có dữ liệu tăng trưởng.</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="Người dùng"
                  stroke="var(--color-orange)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="var(--color-orange-soft)"
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity Log (1 Col) */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-4 text-left">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--color-info)]" />
            <span>Nhật ký hoạt động hệ thống</span>
          </h3>

          <div className="space-y-3">
            {reports.slice(0, 4).map((report) => (
              <div key={report.id} className="rounded-lg bg-[var(--bg-main)] p-3 text-sm space-y-1">
                <div className="text-xs text-[var(--text-muted)]">
                  {new Date(report.createdAt).toLocaleString('vi-VN')}
                </div>
                <div className="text-[var(--text-secondary)] leading-snug">
                  Báo cáo {report.contentType.toLowerCase()} bởi @{report.reporterUsername} · {report.status}
                </div>
              </div>
            ))}
            {reports.length === 0 && <p className="text-sm text-[var(--text-secondary)]">Chưa có hoạt động báo cáo.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
