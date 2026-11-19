import apiClient from './apiClient';

export function listAdminActivityLogs({ actorUserId = '', action = '', targetType = '', page = 0, size = 10 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(Math.min(Number(size) || 10, 50)) });
  const actor = String(actorUserId).trim();
  const actionValue = String(action).trim().slice(0, 80);
  const targetTypeValue = String(targetType).trim().slice(0, 40);

  if (actor) {
    const actorNumber = Number(actor);
    if (!/^\d+$/.test(actor) || !Number.isSafeInteger(actorNumber) || actorNumber <= 0) {
      throw new Error('Actor User ID phải là số nguyên dương.');
    }
    params.set('actorUserId', String(actorNumber));
  }
  if (actionValue) params.set('action', actionValue);
  if (targetTypeValue) params.set('targetType', targetTypeValue);

  return apiClient.get(`/admin/activity-logs?${params}`);
}
