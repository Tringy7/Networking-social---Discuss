import { Link } from 'react-router-dom';
import { ArrowRight, Users, UserRoundCheck, UserRoundX, FolderKanban, FolderCheck, FolderX, FileText, MessageSquare, ShieldAlert, CheckCheck } from 'lucide-react';
import { useAdminData } from '../../components/admin/AdminDataContext.jsx';
import { AdminErrorState, AdminPageHeader, adminNumber } from '../../components/admin/AdminUI.jsx';
export default function AdminDashboardPage() {
  const {
    stats,
    reports,
    reload
  } = useAdminData();
  const data = stats.data;
  const metric = value => stats.loading || stats.error ? '—' : adminNumber(value);
  const reportCount = value => reports.loading || reports.error ? '—' : adminNumber(value);
  const metrics = [{
    label: 'Total Users',
    value: data?.users.total,
    icon: Users,
    tone: 'users'
  }, {
    label: 'Active Users',
    value: data?.users.active,
    icon: UserRoundCheck,
    tone: 'active'
  }, {
    label: 'Suspended Users',
    value: data?.users.suspended,
    icon: UserRoundX,
    tone: 'suspended'
  }, {
    label: 'Total Communities',
    value: data?.communities.total,
    icon: FolderKanban,
    tone: 'communities'
  }, {
    label: 'Active Communities',
    value: data?.communities.active,
    icon: FolderCheck,
    tone: 'active'
  }, {
    label: 'Suspended Communities',
    value: data?.communities.suspended,
    icon: FolderX,
    tone: 'suspended'
  }, {
    label: 'Total Posts',
    value: data?.posts.total,
    icon: FileText,
    tone: 'posts'
  }, {
    label: 'Total Comments',
    value: data?.comments.total,
    icon: MessageSquare,
    tone: 'comments'
  }];
  const moderation = [{
    title: 'Báo cáo chờ xử lý',
    value: reportCount(reports.data?.pending),
    to: '/admin/reports?status=PENDING',
    icon: ShieldAlert,
    pending: !!reports.data?.pending
  }, {
    title: 'Báo cáo đã giải quyết',
    value: reportCount(reports.data?.resolved),
    to: '/admin/reports?status=RESOLVED',
    icon: CheckCheck
  }, {
    title: 'Tài khoản bị khóa',
    value: metric(data?.users.suspended),
    to: '/admin/users?status=SUSPENDED',
    icon: Users
  }, {
    title: 'Cộng đồng bị cấm',
    value: metric(data?.communities.suspended),
    to: '/admin/communities?status=BANED',
    icon: FolderKanban
  }];
  return <div className="admin-page">
    <AdminPageHeader title="Tổng quan hệ thống" description="Nắm bắt hoạt động và những nội dung cần kiểm duyệt trên DISCUSS." loading={stats.loading || reports.loading} onRefresh={reload} />
    <section className="admin-statistics" aria-label="Thống kê hệ thống" aria-busy={stats.loading}>
      {stats.loading && <div className="admin-stat-grid" aria-label="Đang tải thống kê">{metrics.map(({ label }) => <div className="admin-stat-card is-loading" key={label}><span /><strong /><small /></div>)}</div>}
      {!stats.loading && stats.error && <div className="admin-stat-error"><AdminErrorState error={stats.error} retry={stats.reload} /></div>}
      {!stats.loading && !stats.error && <div className="admin-stat-grid">{metrics.map(({ label, value, icon: Icon, tone }) => <article className={`admin-stat-card tone-${tone}`} key={label}><span className="admin-stat-icon"><Icon size={19} strokeWidth={1.8} aria-hidden="true" /></span><span className="admin-stat-label">{label}</span><strong>{adminNumber(value)}</strong></article>)}</div>}
    </section>
    <section className="admin-section"><div className="admin-section-heading"><h2>Kiểm duyệt</h2><Link to="/admin/reports">Mở trung tâm báo cáo <ArrowRight size={14} /></Link></div>
      {reports.error && <div className="admin-notice" role="alert"><span>Chưa tải được số báo cáo. {reports.error}</span><button onClick={reports.reload}>Thử lại</button></div>}
      <div className="admin-moderation-strip">{moderation.map(({
          title,
          value,
          to,
          icon: Icon,
          pending
        }) => <Link key={title} to={to} className={pending ? 'needs-attention' : ''}><span><Icon size={16} />{title}</span><strong>{value}<ArrowRight size={15} /></strong></Link>)}</div>
    </section>
    <section className="admin-section"><div className="admin-section-heading"><h2>Truy cập nhanh</h2></div><div className="admin-quick-links">{[['/admin/users', 'Quản lý người dùng'], ['/admin/reports?status=PENDING', 'Xử lý báo cáo'], ['/admin/communities', 'Quản lý cộng đồng'], ['/admin/posts', 'Quản lý bài viết']].map(([to, label]) => <Link to={to} key={to}>{label}<ArrowRight size={15} /></Link>)}</div></section>
    <section className="admin-activity"><div className="admin-section-heading"><div><h2>Nhật ký hoạt động</h2><p className="admin-panel-description">Xem lại thao tác quản trị theo người thực hiện, hành động hoặc loại đối tượng.</p></div><Link className="admin-button" to="/admin/activity-logs">Mở nhật ký <ArrowRight size={15} /></Link></div></section>
  </div>;
}
