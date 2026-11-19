import apiClient from './apiClient';

export function listAdminPosts({ page = 0, size = 10, status = '', communityName = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set('status', status);
  if (communityName) params.set('communityName', String(communityName).slice(0, 255));

  return apiClient.get(`/admin/posts?${params}`);
}

export function searchAdminPosts({ search, page = 0, size = 10, status = '', communityName = '' } = {}) {
  const term = String(search || '').trim().slice(0, 200);
  if (!term) throw new Error('Search term is required.');

  const params = new URLSearchParams({ search: term, page: String(page), size: String(size) });
  if (status) params.set('status', status);
  if (communityName) params.set('communityName', String(communityName).slice(0, 255));

  return apiClient.get(`/admin/posts/search?${params}`);
}

export function getAdminPostDetail(id) {
  return apiClient.get(`/admin/posts/${encodeURIComponent(String(id))}`);
}

export function deleteAdminPost(id) {
  return apiClient.delete(`/admin/posts/${encodeURIComponent(String(id))}`);
}
