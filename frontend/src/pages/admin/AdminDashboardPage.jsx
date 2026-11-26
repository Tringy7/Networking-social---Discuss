import { Link } from 'react-router-dom';
import { ArrowRight, Users, FolderKanban, FileText, MessageSquare, ShieldAlert, CheckCheck, LockKeyhole } from 'lucide-react';
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
    label: 'Người dùng',
    value: data?.users.total,
    icon: Users,
    active: data?.users.active,
    to: '/admin/users'
  }, {
    label: 'Cộng đồng',
    value: data?.communities.total,
    icon: FolderKanban,
    active: data?.communities.active,
    to: '/admin/communities'
  }, {
    label: 'Bài viết',
    value: data?.posts.total,
    icon: FileText,
    to: '/admin/posts'
  }, {
    label: 'Bình luận',
    value: data?.comments.total,
    icon: MessageSquare
  }];
  const moderation = [{
    title: 'Báo cáo chờ xử lý',
    value: reportCount(reports.data?.pending),
    reportStatus: 'PENDING',
    countKey: 'pending',
    icon: ShieldAlert,
    pending: !!reports.data?.pending
  }, {
    title: 'Báo cáo đã giải quyết',
    value: reportCount(reports.data?.resolved),
    reportStatus: 'RESOLVED',
    countKey: 'resolved',
    icon: CheckCheck
  }, {
    title: 'Tài khoản bị khóa',
    value: metric(data?.users.suspended),
    to: '/admin/users?status=SUSPENDED',
    icon: LockKeyhole
  }, {
    title: 'Cộng đồng bị cấm',
    value: metric(data?.communities.suspended),
    to: '/admin/communities?status=BANED',
    icon: FolderKanban
  }];
  return <div className="admin-page">
    <AdminPageHeader title="Tổng quan hệ thống" description="Theo dõi số liệu hệ thống và công việc kiểm duyệt." loading={stats.loading || reports.loading} onRefresh={reload} />
    <section className="admin-section admin-review" aria-labelledby="admin-review-title" aria-busy={reports.loading}><div className="admin-section-heading"><h2 id="admin-review-title">Kiểm duyệt</h2><Link to="/admin/reports">Xem báo cáo <ArrowRight size={14} aria-hidden="true" /></Link></div>
      {reports.error && <div className="admin-notice" role="alert"><span>Chưa tải được số báo cáo. {reports.error}</span><button onClick={reports.reload}>Thử lại</button></div>}
      <div className="admin-moderation-strip">{moderation.map(({
          title,
          value,
          to,
          icon: Icon,
          pending,
          reportStatus,
          countKey
        }) => reportStatus ? (
          <div key={title} className={`admin-report-summary${pending ? ' needs-attention' : ''}`}>
            <span><Icon size={16} aria-hidden="true" />{title}</span>
            <strong>{value}</strong>
            <ul className="admin-report-type-links">
              {reports.data?.byType.map(({ type, label, [countKey]: count }) => (
                <li key={type}>
                  <Link to={`/admin/reports?type=${type}&status=${reportStatus}`}
                    aria-label={`${title}: ${label}, ${adminNumber(count)} báo cáo`}>
                    <span>{label}</span><span>{adminNumber(count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Link key={title} to={to}><span><Icon size={16} aria-hidden="true" />{title}</span><strong>{value}<ArrowRight size={15} aria-hidden="true" /></strong></Link>
        ))}</div>
    </section>
    <section className="admin-section admin-statistics" aria-labelledby="admin-statistics-title" aria-busy={stats.loading}>
      <div className="admin-section-heading"><h2 id="admin-statistics-title">Thống kê hệ thống</h2></div>
      {stats.loading && <div className="admin-stat-grid" role="status" aria-label="Đang tải thống kê">{metrics.map(({ label }) => <div className="admin-stat-card is-loading" key={label}><span /><strong /><small /></div>)}</div>}
      {!stats.loading && stats.error && <div className="admin-stat-error"><AdminErrorState error={stats.error} retry={stats.reload} /></div>}
      {!stats.loading && !stats.error && <div className="admin-stat-grid">{metrics.map(({ label, value, icon: Icon, active, to }) => {
        const content = <>
          <span className="admin-stat-icon"><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span>
          <span className="admin-stat-label">{label}</span>
          <strong>{adminNumber(value)}</strong>
          {active != null && <small>{adminNumber(active)} đang hoạt động</small>}
          {to && <ArrowRight className="admin-stat-arrow" size={16} aria-hidden="true" />}
        </>;
        return to
          ? <Link className="admin-stat-card" to={to} key={label}>{content}</Link>
          : <article className="admin-stat-card" key={label}>{content}</article>;
      })}</div>}
    </section>
  </div>;
}
