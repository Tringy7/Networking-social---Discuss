import apiClient from './apiClient';

export function listAdminCommunities({ page = 0, size = 10, status = '', visibility = '' }) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'createdAt,desc',
  });

  if (status) params.set('status', status);
  if (visibility) params.set('visibility', visibility);

  return apiClient.get(`/admin/communities?${params}`);
}
