import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Search, X, ChevronLeft, ChevronRight, RefreshCw, MoreHorizontal, Info } from 'lucide-react';
import Modal from '../ui/Modal';
import { useToastStore } from '../../store/useToastStore';
import type { AdminPage } from '../../services/adminModeration';

export const adminNumber = (value: number | undefined | null) => value == null ? '—' : value.toLocaleString('vi-VN');
export const adminDate = (value?: string | null) => !value || Number.isNaN(new Date(value).getTime()) ? '—' : new Date(value).toLocaleDateString('vi-VN');
export const statusLabels: Record<string, string> = { ACTIVE: 'Đang hoạt động', LOCKED: 'Đã khóa', SUSPENDED: 'Đã khóa', PENDING: 'Chờ xử lý', RESOLVED: 'Đã giải quyết', REJECTED: 'Đã bác bỏ', BANED: 'Đã cấm', BANNED: 'Đã cấm', DELETED: 'Đã xóa', PUBLISHED: 'Đã đăng', VISIBLE: 'Hiển thị', HIDDEN: 'Đã ẩn' };
export const roleLabels: Record<string, string> = { USER: 'Người dùng', ADMIN: 'Quản trị viên' };
export function AdminRoleBadge({ role }: { role: string }) {
  return <span className={`admin-role-badge${role === 'ADMIN' ? ' is-admin' : ''}`}>{roleLabels[role] || role}</span>;
}
export function AdminStatusBadge({ status, label }: { status?: string; label?: string }) {
  return <span className={`admin-status status-${(status || 'unknown').toLowerCase()}`}>{label || statusLabels[status || ''] || status || '—'}</span>;
}
export function AdminPageHeader({ title, description, loading, onRefresh, children }: { title: string; description: string; loading?: boolean; onRefresh?: () => void; children?: ReactNode }) {
  return <div className="admin-page-heading"><div><h1>{title}</h1><p>{description}</p></div><div className="admin-heading-actions">{children}{onRefresh && <button className="admin-button" disabled={loading} onClick={onRefresh} aria-label="Làm mới"><RefreshCw size={15} className={loading ? 'admin-spinning' : ''} /><span>Làm mới</span></button>}</div></div>;
}
export function AdminNotice({ children }: { children: ReactNode }) {
  return <div className="admin-capability-note"><Info size={15} aria-hidden="true" /><p>{children}</p></div>;
}
export function AdminEmptyState({ title = 'Không có kết quả', description = 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.', onReset }: { title?: string; description?: string; onReset?: () => void }) {
  return <div className="admin-empty"><Search size={22} aria-hidden="true" /><h2>{title}</h2><p>{description}</p>{onReset && <button className="admin-button" onClick={onReset}>Đặt lại bộ lọc</button>}</div>;
}
export function AdminLoadingSkeleton() {
  return <div className="admin-loading" role="status" aria-label="Đang tải dữ liệu" aria-busy="true">{Array.from({ length: 5 }, (_, i) => <div key={i}><span /><span /><span /></div>)}</div>;
}
export function AdminErrorState({ error, retry }: { error: string; retry: () => void }) {
  return <div className="admin-empty" role="alert"><h2>Không thể tải dữ liệu</h2><p>{error}</p><button className="admin-button" onClick={retry}>Thử lại</button></div>;
}
export function AdminSearchInput({ value, onChange, placeholder = 'Tìm kiếm…', label = 'Tìm kiếm', maxLength = 200 }: { value: string; onChange: (value: string) => void; placeholder?: string; label?: string; maxLength?: number }) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const change = useRef(onChange); change.current = onChange;
  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => change.current(draft.trim()), 350);
    return () => clearTimeout(timer);
  }, [draft, value]);
  return <form className="admin-search" onSubmit={event => { event.preventDefault(); change.current(draft.trim()); }}><label className="sr-only" htmlFor={id}>{label}</label><Search size={16} aria-hidden="true" /><input id={id} placeholder={placeholder} value={draft} maxLength={maxLength} onChange={event => setDraft(event.target.value)} />{draft && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => { setDraft(''); change.current(''); }}><X size={15} /></button>}<button className="admin-search-submit" type="submit">Tìm</button></form>;
}
export function AdminFilter({ label, value, onChange, options, disabled = false, reason }: { label: string; value: string; onChange?: (value: string) => void; options: Array<[string, string]>; disabled?: boolean; reason?: string }) {
  const descriptionId = useId();
  return <label className="admin-filter" title={reason}><span>{label}</span><select aria-label={label} aria-describedby={reason ? descriptionId : undefined} value={value} onChange={event => onChange?.(event.target.value)} disabled={disabled}>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select>{reason && <small id={descriptionId}>{reason}</small>}</label>;
}
export interface AdminColumn<T> { key: string; label: string; render: (row: T) => ReactNode; numeric?: boolean; className?: string }
export function AdminDataTable<T>({ rows, columns, rowKey, loading, error, retry, empty, caption }: { rows: T[]; columns: AdminColumn<T>[]; rowKey: (row: T) => string | number; loading: boolean; error: string; retry: () => void; empty?: ReactNode; caption: string }) {
  if (loading) return <AdminLoadingSkeleton />;
  if (error) return <AdminErrorState error={error} retry={retry} />;
  if (!rows.length) return <>{empty || <AdminEmptyState />}</>;
  return <div className="admin-data-scroll"><table className="admin-data-table"><caption className="sr-only">{caption}</caption><thead><tr>{columns.map(column => <th key={column.key} className={`${column.numeric ? 'admin-numeric' : ''} ${column.className || ''}`}>{column.label || <span className="sr-only">Thao tác</span>}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={rowKey(row)}>{columns.map(column => <td key={column.key} data-label={column.label} className={`${column.numeric ? 'admin-numeric' : ''} ${column.className || ''}`}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>;
}
export function AdminPagination({ result, page, size, disabled, onChange, hidePageSize = false }: { result: Pick<AdminPage<unknown>, 'totalElements' | 'totalPages' | 'content'> | null; page: number; size: number; disabled: boolean; onChange: (values: Record<string, string>) => void; hidePageSize?: boolean }) {
  const total = result?.totalElements;
  const start = result?.content.length ? page * size + 1 : 0;
  const end = result?.content.length ? start + result.content.length - 1 : 0;
  return <div className="admin-pagination">{!hidePageSize && <label>Hiển thị <select aria-label="Số dòng mỗi trang" value={size} onChange={event => onChange({ size: event.target.value })}>{[10, 20, 50].map(value => <option key={value} value={value}>{value}</option>)}</select> / trang</label>}<span>{total == null || disabled ? '—' : `${adminNumber(start)}–${adminNumber(end)} / ${adminNumber(total)}`}</span><div><button className="admin-button" aria-label="Trang trước" disabled={disabled || page === 0} onClick={() => onChange({ page: String(page - 1) })}><ChevronLeft size={16} /></button><span>Trang {page + 1}{result?.totalPages ? ` / ${result.totalPages}` : ''}</span><button className="admin-button" aria-label="Trang sau" disabled={disabled || !result || page + 1 >= result.totalPages} onClick={() => onChange({ page: String(page + 1) })}><ChevronRight size={16} /></button></div></div>;
}
export function AdminRowMenu({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && ref.current?.open) { ref.current.open = false; ref.current.querySelector('summary')?.focus(); } };
    const scroll = () => { if (ref.current) ref.current.open = false; };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape); window.addEventListener('scroll', scroll, true);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); window.removeEventListener('scroll', scroll, true); };
  }, []);
  const position = () => {
    if (!ref.current?.open) return;
    const anchor = ref.current.getBoundingClientRect();
    const panel = ref.current.querySelector<HTMLElement>('.admin-menu-panel');
    if (panel) { panel.style.left = `${Math.max(8, Math.min(anchor.right - 232, innerWidth - 240))}px`; panel.style.top = `${Math.max(8, Math.min(anchor.bottom + 6, innerHeight - panel.offsetHeight - 8))}px`; }
  };
  return <details className="admin-row-menu" ref={ref} onToggle={position}><summary aria-label={`Thao tác ${label}`}><MoreHorizontal size={18} /></summary><div className="admin-menu-panel" onClick={event => { if ((event.target as HTMLElement).closest('button,a') && ref.current) { ref.current.open = false; ref.current.querySelector('summary')?.focus(); } }}>{children}</div></details>;
}
export function AdminDetailDrawer({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <Modal isOpen onClose={onClose} title={title} placement="right" maxWidth="2xl"><div className="admin-drawer-content">{children}</div></Modal>;
}
export function AdminFields({ items }: { items: Array<[string, ReactNode]> }) {
  return <dl className="admin-field-list">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>;
}
export function AdminAvatar({ name, src, square }: { name: string; src?: string | null; square?: boolean }) {
  const [failed, setFailed] = useState(false);
  const tone = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
  return <span className={`admin-person-avatar tone-${tone} ${square ? 'is-square' : ''}`}>{src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : name.slice(0, 1).toUpperCase()}</span>;
}
export interface AdminAction { title: string; description: string; label: string; execute: () => Promise<unknown>; available?: boolean; success: string; danger?: boolean; preview?: ReactNode }
export function AdminConfirmDialog({ action, onClose, onSuccess }: { action: AdminAction; onClose: () => void; onSuccess: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const addToast = useToastStore(state => state.addToast);
  const confirm = async () => {
    if (locked.current || action.available === false) return;
    locked.current = true; setBusy(true); setError('');
    try { await action.execute(); addToast(action.success, 'success'); onSuccess(); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Thao tác chưa hoàn tất.'); }
    finally { locked.current = false; setBusy(false); }
  };
  return <Modal isOpen onClose={() => { if (!locked.current) onClose(); }} closeDisabled={busy} title={action.title} maxWidth="md"><div className="admin-confirm"><p>{action.description}</p>{action.preview && <div className="admin-confirm-preview">{action.preview}</div>}{action.available === false && <AdminNotice>Thao tác này chưa được hệ thống hỗ trợ. Chưa có thay đổi nào được thực hiện.</AdminNotice>}{error && <p className="admin-inline-error" role="alert">{error}</p>}<div className="admin-dialog-actions"><button className="admin-button" onClick={onClose} disabled={busy}>Hủy</button><button className={`admin-button ${action.danger ? 'admin-button-danger' : 'admin-button-primary'}`} onClick={confirm} disabled={busy || action.available === false}>{busy ? 'Đang xử lý…' : action.label}</button></div></div></Modal>;
}
