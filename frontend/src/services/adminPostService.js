import apiClient from './apiClient';

export function listAdminPosts({ page = 0, size = 10, status = '', communityName = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set('status', status);
  if (communityName) params.set('communityName', String(communityName).slice(0, 255));

  return apiClient.get(`/admin/posts?${params}`);
}
