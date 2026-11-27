import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Search, X, ChevronLeft, ChevronRight, RefreshCw, MoreHorizontal, Info } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Modal from '../ui/Modal';
import { useToastStore } from '../../store/useToastStore';
export const adminNumber = value => value == null ? '—' : value.toLocaleString('vi-VN');
export const adminDate = value => !value || Number.isNaN(new Date(value).getTime()) ? '—' : new Date(value).toLocaleDateString('vi-VN');
export const statusLabels = {
  ACTIVE: 'Đang hoạt động',
  LOCKED: 'Đã khóa',
  SUSPENDED: 'Đã khóa',
  PENDING: 'Chờ xử lý',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Đã bác bỏ',
  BANED: 'Đã cấm',
  BANNED: 'Đã cấm',
  DELETED: 'Đã xóa',
  PUBLISHED: 'Đã đăng',
  VISIBLE: 'Hiển thị',
  HIDDEN: 'Đã ẩn'
};
export const roleLabels = {
  USER: 'Người dùng',
  ADMIN: 'Quản trị viên'
};
export function AdminRoleBadge({
  role
}) {
  return <span className={`admin-role-badge${role === 'ADMIN' ? ' is-admin' : ''}`}>{roleLabels[role] || role}</span>;
}
export function AdminStatusBadge({
  status,
  label
}) {
  return <span className={`admin-status status-${(status || 'unknown').toLowerCase()}`}>{label || statusLabels[status || ''] || status || '—'}</span>;
}
export function AdminPageHeader({
  title,
  description,
  loading = false,
  onRefresh = undefined,
  children = undefined
}) {
  return <header className="admin-page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{(children || onRefresh) && <div className="admin-heading-actions">{children}{onRefresh && <button type="button" className="admin-button" disabled={loading} onClick={onRefresh} aria-label="Làm mới"><RefreshCw size={15} className={loading ? 'admin-spinning' : ''} aria-hidden="true" /><span>Làm mới</span></button>}</div>}</header>;
}
export function AdminNotice({
  children
}) {
  return <div className="admin-capability-note"><Info size={15} aria-hidden="true" /><p>{children}</p></div>;
}
export function AdminEmptyState({
  title = 'Không có kết quả',
  description = 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.',
  onReset
}) {
  return <div className="admin-empty"><Search size={22} aria-hidden="true" /><h2>{title}</h2><p>{description}</p>{onReset && <button className="admin-button" onClick={onReset}>Đặt lại bộ lọc</button>}</div>;
}
export function AdminLoadingSkeleton() {
  return <div className="admin-loading" role="status" aria-label="Đang tải dữ liệu" aria-busy="true">{Array.from({
      length: 5
    }, (_, i) => <div key={i}><span /><span /><span /></div>)}</div>;
}
export function AdminErrorState({
  error,
  retry
}) {
  return <div className="admin-empty" role="alert"><h2>Không thể tải dữ liệu</h2><p>{error}</p><button className="admin-button" onClick={retry}>Thử lại</button></div>;
}
export function AdminSearchInput({
  value,
  onChange,
  placeholder = 'Tìm kiếm…',
  label = 'Tìm kiếm',
  maxLength = 200
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const change = useRef(onChange);
  change.current = onChange;
  useEffect(() => {
    setDraft(value);
  }, [value]);
  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => change.current(draft.trim()), 350);
    return () => clearTimeout(timer);
  }, [draft, value]);
  return <form className="admin-search" onSubmit={event => {
    event.preventDefault();
    change.current(draft.trim());
  }}><label className="sr-only" htmlFor={id}>{label}</label><Search size={16} aria-hidden="true" /><input id={id} placeholder={placeholder} value={draft} maxLength={maxLength} onChange={event => setDraft(event.target.value)} />{draft && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => {
      setDraft('');
      change.current('');
    }}><X size={15} /></button>}<button className="admin-search-submit" type="submit">Tìm</button></form>;
}
export function AdminFilter({
  label,
  value,
  onChange,
  options,
  disabled = false,
  reason
}) {
  const descriptionId = useId();
  return <label className="admin-filter" title={reason}><span>{label}</span><select aria-label={label} aria-describedby={reason ? descriptionId : undefined} value={value} onChange={event => onChange?.(event.target.value)} disabled={disabled}>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select>{reason && <small id={descriptionId}>{reason}</small>}</label>;
}
export function AdminDataTable({
  rows,
  columns,
  rowKey,
  loading,
  error,
  retry,
  empty,
  caption
}) {
  if (loading) return <AdminLoadingSkeleton />;
  if (error) return <AdminErrorState error={error} retry={retry} />;
  if (!rows.length) return <>{empty || <AdminEmptyState />}</>;
  return <div className="admin-data-scroll" tabIndex={0} role="region" aria-label={caption}><table className="admin-data-table"><caption className="sr-only">{caption}</caption><thead><tr>{columns.map(column => <th scope="col" key={column.key} className={`${column.numeric ? 'admin-numeric' : ''} ${column.className || ''}`}>{column.label || <span className="sr-only">Thao tác</span>}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={rowKey(row)}>{columns.map(column => <td key={column.key} data-label={column.label} className={`${column.numeric ? 'admin-numeric' : ''} ${column.className || ''}`}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>;
}
export function AdminPagination({
  result,
  page,
  size,
  disabled,
  onChange,
  hidePageSize = false
}) {
  const total = result?.totalElements;
  const currentPage = result?.page ?? page;
  const currentSize = result?.size ?? size;
  const isFirst = result?.first ?? currentPage === 0;
  const isLast = result?.last ?? (result ? currentPage + 1 >= result.totalPages : true);
  const start = result?.content.length ? currentPage * currentSize + 1 : 0;
  const end = result?.content.length ? start + result.content.length - 1 : 0;
  return <div className="admin-pagination">{!hidePageSize && <label>Hiển thị <select aria-label="Số dòng mỗi trang" value={size} onChange={event => onChange({
        size: event.target.value
      })}>{[10, 20, 50].map(value => <option key={value} value={value}>{value}</option>)}</select> / trang</label>}<span>{total == null || disabled ? '—' : `${adminNumber(start)}–${adminNumber(end)} / ${adminNumber(total)}`}</span><div><button className="admin-button" aria-label="Trang trước" disabled={disabled || isFirst} onClick={() => onChange({
        page: String(currentPage - 1)
      })}><ChevronLeft size={16} /></button><span>Trang {currentPage + 1}{result?.totalPages ? ` / ${result.totalPages}` : ''}</span><button className="admin-button" aria-label="Trang sau" disabled={disabled || isLast} onClick={() => onChange({
        page: String(currentPage + 1)
      })}><ChevronRight size={16} /></button></div></div>;
}
export function AdminRowMenu({
  label,
  children
}) {
  const ref = useRef(null);
  useEffect(() => {
    const close = event => {
      if (ref.current && !ref.current.contains(event.target)) ref.current.open = false;
    };
    const escape = event => {
      if (event.key === 'Escape' && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector('summary')?.focus();
      }
    };
    const scroll = () => {
      if (ref.current) ref.current.open = false;
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', scroll, true);
    };
  }, []);
  const position = () => {
    if (!ref.current?.open) return;
    const anchor = ref.current.getBoundingClientRect();
    const panel = ref.current.querySelector('.admin-menu-panel');
    if (panel) {
      panel.style.left = `${Math.max(8, Math.min(anchor.right - 232, innerWidth - 240))}px`;
      panel.style.top = `${Math.max(8, Math.min(anchor.bottom + 6, innerHeight - panel.offsetHeight - 8))}px`;
    }
  };
  return <details className="admin-row-menu" ref={ref} onToggle={position}><summary aria-label={`Thao tác ${label}`}><MoreHorizontal size={18} /></summary><div className="admin-menu-panel" onClick={event => {
      if (event.target.closest('button,a') && ref.current) {
        ref.current.open = false;
        ref.current.querySelector('summary')?.focus();
      }
    }}>{children}</div></details>;
}
export function AdminDetailLink({ to, ...props }) {
  const { search } = useLocation();
  return <Link to={{ pathname: to, search }} {...props} />;
}
export function AdminDetailPage({ title, backTo, backLabel, backSearch, children }) {
  const headingRef = useRef(null);
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    headingRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <section className="admin-page admin-detail-page">
      <Link className="admin-detail-back" to={{ pathname: backTo, search: backSearch ?? search }}>
        <ArrowLeft size={17} aria-hidden="true" />{backLabel}
      </Link>
      <h1 ref={headingRef} tabIndex={-1}>{title}</h1>
      {children}
    </section>
  );
}
export function AdminFields({
  items
}) {
  return <dl className="admin-field-list">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>;
}
export function AdminAvatar({
  name,
  src,
  square
}) {
  const [failed, setFailed] = useState(false);
  const tone = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
  return <span className={`admin-person-avatar tone-${tone} ${square ? 'is-square' : ''}`}>{src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : name.slice(0, 1).toUpperCase()}</span>;
}
export function AdminConfirmDialog({
  action,
  onClose,
  onSuccess
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const addToast = useToastStore(state => state.addToast);
  const confirm = async () => {
    if (locked.current || action.available === false) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await action.execute();
      addToast(action.success, 'success');
      onSuccess();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Thao tác chưa hoàn tất.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return <Modal isOpen onClose={() => {
    if (!locked.current) onClose();
  }} closeDisabled={busy} title={action.title} maxWidth="md"><div className="admin-confirm"><p>{action.description}</p>{action.preview && <div className="admin-confirm-preview">{action.preview}</div>}{action.available === false && <AdminNotice>Thao tác này chưa được hệ thống hỗ trợ. Chưa có thay đổi nào được thực hiện.</AdminNotice>}{error && <p className="admin-inline-error" role="alert">{error}</p>}<div className="admin-dialog-actions"><button className="admin-button" onClick={onClose} disabled={busy}>Hủy</button><button className={`admin-button ${action.danger ? 'admin-button-danger' : 'admin-button-primary'}`} onClick={confirm} disabled={busy || action.available === false}>{busy ? 'Đang xử lý…' : action.label}</button></div></div></Modal>;
}
