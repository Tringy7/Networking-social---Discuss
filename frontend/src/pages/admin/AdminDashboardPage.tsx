import { Link } from 'react-router-dom';
import { ArrowRight, Users, FolderKanban, FileText, MessageSquare, ShieldAlert, CheckCheck } from 'lucide-react';
import { useAdminData } from '../../components/admin/AdminDataContext';
import { AdminNotice, AdminPageHeader, adminNumber } from '../../components/admin/AdminUI';

export default function AdminDashboardPage() {
  const { stats, reports, reload } = useAdminData();
  const data = stats.data;
  const metric = (value?: number) => stats.loading || stats.error ? '—' : adminNumber(value);
  const reportCount = (value?: number) => reports.loading || reports.error ? '—' : adminNumber(value);
  const metrics = [
    { label: 'Tổng người dùng', value: data?.users.total, icon: Users },
    { label: 'Tổng cộng đồng', value: data?.communities.total, icon: FolderKanban },
    { label: 'Tổng bài viết', value: data?.posts.total, icon: FileText },
    { label: 'Tổng bình luận', value: data?.comments.total, icon: MessageSquare },
  ];
  const moderation = [
    { title: 'Báo cáo chờ xử lý', value: reportCount(reports.data?.pending), to: '/admin/reports?status=PENDING', icon: ShieldAlert, pending: !!reports.data?.pending },
    { title: 'Báo cáo đã giải quyết', value: reportCount(reports.data?.resolved), to: '/admin/reports?status=RESOLVED', icon: CheckCheck },
    { title: 'Tài khoản bị khóa', value: metric(data?.users.suspended), to: '/admin/users?status=SUSPENDED', icon: Users },
    { title: 'Cộng đồng bị cấm', value: metric(data?.communities.suspended), to: '/admin/communities?status=BANED', icon: FolderKanban },
  ];
  return <div className="admin-page">
    <AdminPageHeader title="Tổng quan hệ thống" description="Nắm bắt hoạt động và những nội dung cần kiểm duyệt trên DISCUSS." loading={stats.loading || reports.loading} onRefresh={reload} />
    {stats.error && <div className="admin-notice" role="alert"><span>Chưa tải được thống kê. {stats.error}</span><button onClick={stats.reload}>Thử lại</button></div>}
    <section className="admin-metrics" aria-label="Thống kê hệ thống" aria-busy={stats.loading}>{metrics.map(({ label, value, icon: Icon }) => <div className="admin-metric" key={label}><span className="admin-metric-label">{label}<Icon size={15} strokeWidth={1.7} /></span><strong>{metric(value)}</strong><small>Tổng số trên hệ thống</small></div>)}</section>
    <section className="admin-section"><div className="admin-section-heading"><h2>Kiểm duyệt</h2><Link to="/admin/reports">Mở trung tâm báo cáo <ArrowRight size={14} /></Link></div>
      {reports.error && <div className="admin-notice" role="alert"><span>Chưa tải được số báo cáo. {reports.error}</span><button onClick={reports.reload}>Thử lại</button></div>}
      <div className="admin-moderation-strip">{moderation.map(({ title, value, to, icon: Icon, pending }) => <Link key={title} to={to} className={pending ? 'needs-attention' : ''}><span><Icon size={16} />{title}</span><strong>{value}<ArrowRight size={15} /></strong></Link>)}</div>
    </section>
    <div className="admin-overview-grid">
      <section className="admin-panel"><div className="admin-panel-heading"><h2>Trạng thái người dùng</h2><Link to="/admin/users">Xem tất cả <ArrowRight size={14} /></Link></div><dl className="admin-breakdown">
        <div className="admin-breakdown-row"><dt><i className="admin-state-dot active" />Đang hoạt động</dt><dd>{metric(data?.users.active)}</dd></div>
        <div className="admin-breakdown-row"><dt><i className="admin-state-dot suspended" />Đã khóa</dt><dd>{metric(data?.users.suspended)}</dd></div>
        <div className="admin-breakdown-row"><dt><i className="admin-state-dot" />Chờ xác thực / trạng thái khác</dt><dd>{metric(data ? Math.max(0, data.users.total - data.users.active - data.users.suspended) : undefined)}</dd></div>
      </dl></section>
      <section className="admin-panel"><div className="admin-panel-heading"><h2>Trạng thái cộng đồng</h2><Link to="/admin/communities">Xem danh sách <ArrowRight size={14} /></Link></div><dl className="admin-breakdown">
        <div className="admin-breakdown-row"><dt><i className="admin-state-dot active" />Đang hoạt động</dt><dd>{metric(data?.communities.active)}</dd></div>
        <div className="admin-breakdown-row"><dt><i className="admin-state-dot suspended" />Đã cấm</dt><dd>{metric(data?.communities.suspended)}</dd></div>
        <div className="admin-breakdown-row"><dt><i className="admin-state-dot" />Trạng thái khác</dt><dd>{metric(data ? Math.max(0, data.communities.total - data.communities.active - data.communities.suspended) : undefined)}</dd></div>
      </dl></section>
    </div>
    <section className="admin-section"><div className="admin-section-heading"><h2>Truy cập nhanh</h2></div><div className="admin-quick-links">{[['/admin/users', 'Quản lý người dùng'], ['/admin/reports?status=PENDING', 'Xử lý báo cáo'], ['/admin/communities', 'Quản lý cộng đồng'], ['/admin/posts', 'Quản lý bài viết']].map(([to, label]) => <Link to={to} key={to}>{label}<ArrowRight size={15} /></Link>)}</div></section>
    <section className="admin-activity"><h2>Hoạt động kiểm duyệt gần đây</h2><AdminNotice>Nhật ký kiểm duyệt chưa khả dụng. Các sự kiện khóa tài khoản, cấm cộng đồng và xử lý báo cáo sẽ xuất hiện khi tính năng được hỗ trợ.</AdminNotice></section>
  </div>;
}
