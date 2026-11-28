import { Link, Outlet, useLocation, matchPath } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const adminPages = {
  '/admin': 'Tổng quan',
  '/admin/users': 'Người dùng',
  '/admin/communities': 'Cộng đồng',
  '/admin/posts': 'Bài viết',
  '/admin/reports': 'Báo cáo',
  '/admin/categories': 'Danh mục',
  '/admin/reputation': 'Điểm uy tín',
};

export function AdminBreadcrumb() {
  const { pathname, search } = useLocation();
  const parent = Object.keys(adminPages).find(path => path !== '/admin' && matchPath(`${path}/*`, pathname) && pathname !== path);
  const currentPage = parent ? 'Chi tiết' : adminPages[pathname] || 'Quản trị';

  return (
    <nav className="admin-breadcrumb" aria-label="Đường dẫn">
      <ol>
        <li><Link to="/admin">Quản trị</Link></li>
        {parent && <li><ChevronRight size={14} aria-hidden="true" /><Link to={{ pathname: parent, search }}>{adminPages[parent]}</Link></li>}
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
