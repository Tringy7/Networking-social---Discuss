import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import useAdminResource from '../../hooks/useAdminResource';
import { createAdminCategory, deleteAdminCategory, listAdminCategories, updateAdminCategory } from '../../services/adminCategoryService.js';
import { useToastStore } from '../../store/useToastStore';
import {
  AdminDataTable,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminPageHeader,
  adminNumber,
} from '../../components/admin/AdminUI.jsx';

function slugFromName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function CategoryFormModal({ category, onClose, onSaved }) {
  const isEditing = Boolean(category);
  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [slugEdited, setSlugEdited] = useState(isEditing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const addToast = useToastStore(state => state.addToast);

  const submit = async event => {
    event.preventDefault();
    const categoryName = name.trim();
    const categorySlug = slug.trim();
    if (!categoryName) return setError('Category Name là bắt buộc.');
    if (!categorySlug) return setError('Slug là bắt buộc.');
    if (categoryName.length > 100 || categorySlug.length > 100) return setError('Mỗi trường không được vượt quá 100 ký tự.');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(categorySlug)) {
      return setError('Slug phải gồm chữ thường, số và dấu gạch nối ở giữa.');
    }

    setBusy(true);
    setError('');
    try {
      const saved = isEditing
        ? await updateAdminCategory(category.id, { name: categoryName, slug: categorySlug })
        : await createAdminCategory({ name: categoryName, slug: categorySlug });
      addToast(`Category “${saved.name || categoryName}” ${isEditing ? 'updated' : 'created'} successfully.`, 'success');
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu danh mục.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={() => !busy && onClose()} closeDisabled={busy} title={isEditing ? 'Sửa danh mục' : 'Thêm danh mục'} maxWidth="md">
      <form className="admin-edit-form admin-category-create-form" onSubmit={submit}>
        <label htmlFor="admin-category-name">Tên danh mục
          <input
            id="admin-category-name"
            value={name}
            maxLength={100}
            required
            autoFocus
            onChange={event => {
              const value = event.target.value;
              setName(value);
              if (!slugEdited) setSlug(slugFromName(value));
            }}
            placeholder="Ví dụ: Lập trình"
          />
        </label>
        <label htmlFor="admin-category-slug">Slug
          <input
            id="admin-category-slug"
            value={slug}
            maxLength={100}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
            onChange={event => {
              setSlugEdited(true);
              setSlug(event.target.value);
            }}
            placeholder="vi-du-lap-trinh"
            aria-describedby="admin-category-slug-hint"
          />
          <small id="admin-category-slug-hint">Chỉ dùng chữ thường, số và dấu gạch nối ở giữa.</small>
        </label>
        {error && <p className="admin-inline-error" role="alert">{error}</p>}
        <div className="admin-dialog-actions">
          <button className="admin-button" type="button" onClick={onClose} disabled={busy}>Hủy</button>
          <button className="admin-button admin-button-primary" type="submit" disabled={busy}>
            {busy ? 'Đang lưu…' : isEditing ? 'Lưu thay đổi' : 'Thêm danh mục'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function CategoryManagementPage() {
  const result = useAdminResource(listAdminCategories);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const categories = Array.isArray(result.data) ? result.data : [];
  const columns = [
    { key: 'id', label: 'ID', numeric: true, render: category => adminNumber(category.id) },
    { key: 'name', label: 'Tên danh mục', render: category => <strong>{category.name || '—'}</strong> },
    { key: 'slug', label: 'Slug', render: category => <code className="admin-category-slug">{category.slug || '—'}</code> },
    {
      key: 'actions',
      label: 'Thao tác',
      className: 'admin-actions-cell',
      render: category => (
        <div className="admin-category-row-actions">
          <button className="admin-text-action" type="button" onClick={() => setEditingCategory(category)}>Sửa</button>
          <button className="admin-text-action is-danger" type="button" onClick={() => setDeleteTarget(category)}>Xóa</button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page admin-category-management">
      <AdminPageHeader
        title="Quản lý danh mục"
        description="Danh sách danh mục đang được quản lý trong Discuss."
        loading={result.loading}
        onRefresh={result.reload}
      ><button className="admin-button admin-button-primary" type="button" onClick={() => setCreateOpen(true)}>Thêm danh mục</button></AdminPageHeader>
      <div className="admin-list-meta">
        <span role="status">
          {result.loading
            ? 'Đang tải danh mục…'
            : result.error
              ? 'Chưa tải được danh sách danh mục'
              : `${adminNumber(categories.length)} danh mục`}
        </span>
      </div>
      <div className="admin-categories-table">
        <AdminDataTable
          rows={categories}
          columns={columns}
          rowKey={category => category.id}
          loading={result.loading}
          error={result.error}
          retry={result.reload}
          caption="Danh sách danh mục"
          empty={<AdminEmptyState title="Chưa có danh mục" description="Danh mục sẽ xuất hiện tại đây khi có dữ liệu từ hệ thống." />}
        />
      </div>
      {createOpen && <CategoryFormModal key="create" onClose={() => setCreateOpen(false)} onSaved={result.reload} />}
      {editingCategory && <CategoryFormModal key={editingCategory.id} category={editingCategory} onClose={() => setEditingCategory(null)} onSaved={result.reload} />}
      {deleteTarget && <AdminConfirmDialog
        action={{
          title: 'Xóa danh mục',
          label: 'Xóa danh mục',
          danger: true,
          description: 'Danh mục đã chọn sẽ bị xóa.',
          preview: <strong>{deleteTarget.name}</strong>,
          execute: () => deleteAdminCategory(deleteTarget.id),
          success: `Category “${deleteTarget.name}” deleted successfully.`,
        }}
        onClose={() => setDeleteTarget(null)}
        onSuccess={result.reload}
      />}
    </div>
  );
}
