import { Link, Outlet, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const adminPages = {
  '/admin': 'Tổng quan',
  '/admin/users': 'Người dùng',
  '/admin/communities': 'Cộng đồng',
  '/admin/posts': 'Bài viết',
  '/admin/reports': 'Báo cáo',
  '/admin/categories': 'Danh mục',
  '/admin/activity-logs': 'Activity Logs',
  '/admin/reputation': 'Điểm uy tín',
};

export function AdminBreadcrumb() {
  const { pathname } = useLocation();
  const currentPage = adminPages[pathname] || 'Quản trị';

  return (
    <nav className="admin-breadcrumb" aria-label="Đường dẫn">
      <ol>
        <li><Link to="/admin">DISCUSS Admin</Link></li>
        <li aria-current="page"><ChevronRight size={14} aria-hidden="true" /><span>{currentPage}</span></li>
      </ol>
    </nav>
  );
}

export default function AdminContent() {
  return (
    <div className="admin-content">
      <AdminBreadcrumb />
      <Outlet />
    </div>
  );
}
