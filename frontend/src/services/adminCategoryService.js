import apiClient from './apiClient';

export function listAdminCategories() {
  return apiClient.get('/admin/categories');
}

export function createAdminCategory({ name, slug }) {
  const payload = validateCategory({ name, slug });
  return apiClient.post('/admin/categories', payload);
}

export function updateAdminCategory(id, { name, slug }) {
  const payload = validateCategory({ name, slug });
  return apiClient.patch(`/admin/categories/${encodeURIComponent(String(id))}`, payload);
}

export function deleteAdminCategory(id) {
  return apiClient.delete(`/admin/categories/${encodeURIComponent(String(id))}`);
}

function validateCategory({ name, slug }) {
  const categoryName = String(name || '').trim();
  const categorySlug = String(slug || '').trim();
  if (!categoryName) throw new Error('Category Name là bắt buộc.');
  if (!categorySlug) throw new Error('Slug là bắt buộc.');
  if (categoryName.length > 100 || categorySlug.length > 100) {
    throw new Error('Mỗi trường không được vượt quá 100 ký tự.');
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(categorySlug)) {
    throw new Error('Slug chỉ gồm chữ thường, số và dấu gạch nối ở giữa.');
  }

  return { name: categoryName, slug: categorySlug };
}
