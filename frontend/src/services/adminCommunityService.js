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

export function searchAdminCommunities({ search, page = 0, size = 10, status = '', visibility = '' }) {
  const term = String(search || '').trim().slice(0, 200);
  if (!term) throw new Error('Search term is required.');

  const params = new URLSearchParams({
    search: term,
    page: String(page),
    size: String(size),
  });

  if (status) params.set('status', status);
  if (visibility) params.set('visibility', visibility);

  return apiClient.get(`/admin/communities/search?${params}`);
}

export function getAdminCommunityDetail(id) {
  return apiClient.get(`/admin/communities/${encodeURIComponent(String(id))}`);
}

export function lockAdminCommunity(id) {
  return apiClient.patch(`/admin/communities/${encodeURIComponent(String(id))}/lock`);
}
