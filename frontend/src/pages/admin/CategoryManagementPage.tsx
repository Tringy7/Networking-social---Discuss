import { useMemo, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { adminModeration, adminMutations, adminCapabilities, paginate, type AdminCategory } from '../../services/adminModeration';
import { AdminPageHeader, AdminSearchInput, AdminNotice, AdminDataTable, AdminEmptyState, AdminPagination, AdminRowMenu, AdminConfirmDialog, adminNumber, type AdminAction, type AdminColumn } from '../../components/admin/AdminUI';

function CategoryForm({ category, categories, onClose, onSuccess }: { category: Partial<AdminCategory>; categories: AdminCategory[]; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(category.name || '');
  const [slug, setSlug] = useState(category.slug || '');
  const [error, setError] = useState('');
  const available = category.id ? adminCapabilities.categoryEdit : adminCapabilities.categoryCreate;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) { setError('Nhập tên danh mục và slug gồm chữ thường, số, dấu gạch nối.'); return; }
    if (categories.some(item => item.id !== category.id && (item.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase() || item.slug === slug.trim()))) { setError('Tên hoặc slug đã có trong danh sách hiện tại.'); return; }
    if (!available) { setError('Lưu danh mục chưa được hệ thống hỗ trợ.'); return; }
    try { await adminMutations.saveCategory({ ...category, name: name.trim(), slug: slug.trim() }); onSuccess(); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể lưu danh mục.'); }
  };
  return <Modal isOpen onClose={onClose} title={category.id ? 'Chỉnh sửa danh mục' : 'Tạo danh mục'} maxWidth="md"><form className="admin-edit-form" onSubmit={submit}><AdminNotice>Danh mục hiện chỉ hỗ trợ xem. Tạo mới, chỉnh sửa và quy tắc slug chưa được cung cấp; biểu mẫu chưa thể lưu.</AdminNotice><label>Tên danh mục<input value={name} onChange={event => setName(event.target.value)} maxLength={100} required placeholder="Tên danh mục" /></label><label>Slug<input value={slug} onChange={event => setSlug(event.target.value)} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} placeholder="ten-danh-muc" aria-describedby="admin-slug-help" /><small id="admin-slug-help">Bản nháp đường dẫn. Quyền chỉnh sửa slug cần được xác nhận khi tính năng lưu khả dụng.</small></label>{error && <p role="alert" className="admin-inline-error">{error}</p>}<div className="admin-dialog-actions"><button className="admin-button" type="button" onClick={onClose}>Hủy</button><button className="admin-button admin-button-primary" type="submit" disabled={!available}>Lưu danh mục</button></div></form></Modal>;
}
export default function CategoryManagementPage() {
  const result = useAdminResource(adminModeration.categories);
  const query = useAdminQuery();
  const search = query.params.get('search') || '';
  const [editing, setEditing] = useState<Partial<AdminCategory> | null>(null);
  const [action, setAction] = useState<AdminAction | null>(null);
  const page = useMemo(() => paginate((result.data || []).filter(row => `${row.name} ${row.slug}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())), query.page, query.size), [result.data, search, query.page, query.size]);
  const columns: AdminColumn<AdminCategory>[] = [
    { key: 'name', label: 'Tên danh mục', render: row => <strong>{row.name}</strong> },
    { key: 'slug', label: 'Slug', render: row => row.slug },
    { key: 'actions', label: 'Thao tác', className: 'admin-actions-cell', render: row => <AdminRowMenu label={row.name}><button onClick={() => setEditing(row)}>Chỉnh sửa danh mục</button><button className="is-danger" onClick={() => setAction({ title: 'Xóa danh mục', label: 'Xác nhận xóa', danger: true, available: adminCapabilities.categoryDelete, description: `Xóa danh mục “${row.name}”. Không tự động xóa cộng đồng liên quan. Việc xóa phải tuân theo ràng buộc của hệ thống.`, execute: () => adminMutations.deleteCategory(row.id), success: 'Đã xóa danh mục.' })}>Xóa danh mục</button></AdminRowMenu> },
  ];
  return <div className="admin-page"><AdminPageHeader title="Quản lý danh mục" description="Tổ chức và quản lý các danh mục cộng đồng." loading={result.loading} onRefresh={result.reload}><button className="admin-button admin-button-primary" aria-label="Tạo danh mục" onClick={() => setEditing({})}><Plus size={15} /><span>Tạo danh mục</span></button></AdminPageHeader>
    <AdminNotice>Đã hỗ trợ danh sách và tìm kiếm danh mục. Tạo, sửa, xóa và số cộng đồng theo danh mục chưa khả dụng.</AdminNotice>
    <div className="admin-table-toolbar"><AdminSearchInput label="Tìm danh mục" value={search} onChange={value => query.update({ search: value }, true)} placeholder="Tìm tên hoặc slug danh mục…" /></div><div className="admin-list-meta"><span role="status">{result.loading ? 'Đang tải danh mục…' : result.error ? 'Chưa tải được danh mục' : `${adminNumber(page.totalElements)} danh mục`}</span>{search && <button onClick={query.reset}>Đặt lại bộ lọc</button>}</div>
    <div className="admin-categories-table"><AdminDataTable rows={page.content} columns={columns} rowKey={row => row.id} loading={result.loading} error={result.error} retry={result.reload} caption="Danh mục cộng đồng" empty={<AdminEmptyState title="Không tìm thấy danh mục" onReset={query.reset} />} /></div>
    <AdminPagination result={result.loading || result.error ? null : page} page={query.page} size={query.size} disabled={result.loading || !!result.error} onChange={query.update} />
    {editing && <CategoryForm category={editing} categories={result.data || []} onClose={() => setEditing(null)} onSuccess={result.reload} />}
    {action && <AdminConfirmDialog action={action} onClose={() => setAction(null)} onSuccess={result.reload} />}
  </div>;
}

