import apiClient from './apiClient';
import { adminService, commentService, type CommentMutationResponse } from './index';
import type { Post } from '../types';

export interface AdminPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
export type ReportType = 'POST' | 'COMMENT' | 'COMMUNITY';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';
export interface AdminReport {
  id: number;
  targetType: ReportType;
  targetId: number;
  communityName: string;
  reporterUsername: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  action: string | null;
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}
export interface AdminCommunity {
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  categoryName: string | null;
  communityStatus?: string;
  status?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  createdAt: string;
  owner?: { userId: number; username: string; displayName: string; avatarUrl: string | null };
}
export interface AdminCategory { id: number; name: string; slug: string }
export type AdminPost = Post & { status: string };
export type AdminComment = CommentMutationResponse;

// Mutations without a matching backend endpoint remain unavailable here.
export const adminCapabilities = {
  userStatus: true, userRoleFilter: true,
  communityStatus: true, allCommunityStates: true,
  reportResolution: false, reportDateFilter: false,
  categoryCreate: false, categoryEdit: false, categoryDelete: false,
  activityLog: false, allPostStates: false,
} as const;

const unavailable = (action: string): Promise<never> =>
  Promise.reject(new Error(`${action} chưa được hệ thống hỗ trợ.`));
export const adminMutations = {
  setUserStatus: (id: string | number, status: string) => status === 'ACTIVE'
    ? adminService.unlockUser(id)
    : adminService.lockUser(id),
  setCommunityStatus: (id: number, status: string) => apiClient.patch<{ message: string }>(`/admin/communities/${id}/${status === 'ACTIVE' ? 'unlock' : 'lock'}`),
  resolveReport: (report: AdminReport, status: 'RESOLVED' | 'REJECTED', resolutionNote = '') => {
    const note = resolutionNote.trim();
    if (!note || note.length > 2000) return Promise.reject(new Error('Ghi chú xử lý phải có từ 1 đến 2000 ký tự.'));
    const action = status === 'RESOLVED' ? 'resolve' : 'reject';
    return apiClient.patch<AdminReport>(`/admin/reports/${report.targetType}/${report.id}/${action}`, { resolutionNote: note });
  },
  saveCategory: (_value: Partial<AdminCategory>) => unavailable('Lưu danh mục'),
  deleteCategory: (_id: number) => unavailable('Xóa danh mục'),
  deletePost: (id: string) => apiClient.delete<{ message: string }>(`/admin/posts/${encodeURIComponent(id)}`),
  deleteComment: commentService.delete,
};

export function paginate<T>(rows: T[], page: number, size: number): AdminPage<T> {
  const content = rows.slice(page * size, (page + 1) * size);
  return { content, page, size, totalElements: rows.length, totalPages: Math.ceil(rows.length / size),
    first: page === 0, last: (page + 1) * size >= rows.length, empty: content.length === 0 };
}

// Read every page before applying a client filter, never just the visible page.
async function readAll<T>(load: (page: number) => Promise<AdminPage<T>>): Promise<T[]> {
  const first = await load(0);
  const rows = [...first.content];
  for (let page = 1; page < first.totalPages; page += 4) {
    const batch = await Promise.all(Array.from({ length: Math.min(4, first.totalPages - page) }, (_, i) => load(page + i)));
    rows.push(...batch.flatMap(result => result.content));
  }
  return rows;
}

const reportTypes: ReportType[] = ['POST', 'COMMENT', 'COMMUNITY'];
function reportPage(type: ReportType, page: number, size: number, status = '', communityName = '') {
  const query = new URLSearchParams({ type, page: String(page), size: String(size) });
  if (status) query.set('status', status);
  if (communityName) query.set('communityName', communityName);
  return apiClient.get<AdminPage<AdminReport>>(`/admin/reports?${query}`);
}

export const adminModeration = {
  stats: adminService.getStats,
  users: adminService.listUsers,
  communities: (options: { page: number; size: number; search?: string; status?: string; visibility?: string }) => {
    const query = new URLSearchParams({ page: String(options.page), size: String(options.size), sort: 'createdAt,desc' });
    if (options.status) query.set('status', options.status);
    if (options.visibility) query.set('visibility', options.visibility);
    const search = options.search?.trim();
    if (search) query.set('search', search);
    return apiClient.get<AdminPage<AdminCommunity>>(`/admin/communities${search ? '/search' : ''}?${query}`);
  },
  communityDetail: (id: number) => apiClient.get<AdminCommunity>(`/admin/communities/${id}`),
  categories: () => apiClient.get<AdminCategory[]>('/categories'),
  community: (name: string) => apiClient.get<AdminCommunity>(`/communities/${encodeURIComponent(name)}`),
  activeCommunities: () => readAll<AdminCommunity>(page => apiClient.get(`/admin/communities?status=ACTIVE&page=${page}&size=50&sort=createdAt,desc`)),
  posts: (options: { page: number; size: number; search?: string; community?: string; status?: string }) => {
    const query = new URLSearchParams({ page: String(options.page), size: String(options.size) });
    const search = options.search?.trim();
    if (search) query.set('search', search);
    if (options.community) query.set('communityName', options.community);
    if (options.status) query.set('status', options.status);
    return apiClient.get<AdminPage<AdminPost>>(`/admin/posts${search ? '/search' : ''}?${query}`);
  },
  post: (id: string) => apiClient.get<AdminPost>(`/admin/posts/${encodeURIComponent(id)}`),
  report: (type: ReportType, id: number) => apiClient.get<AdminReport>(`/admin/reports/${type}/${id}`),
  comments: commentService.list,
  reports: async (options: { type?: ReportType | ''; status?: string; community?: string; page: number; size: number }): Promise<AdminPage<AdminReport>> => {
    if (options.type) return reportPage(options.type, options.page, options.size, options.status, options.community);
    // Each source is ordered newest first. Its first K rows suffice to merge the
    // first K rows globally, without downloading the complete report history.
    const needed = (options.page + 1) * options.size;
    const batchSize = 50;
    const sources = await Promise.all(reportTypes.map(async type => {
      const first = await reportPage(type, 0, batchSize, options.status, options.community);
      const rows = [...first.content];
      const pages = Math.min(first.totalPages, Math.ceil(needed / batchSize));
      for (let page = 1; page < pages; page++) rows.push(...(await reportPage(type, page, batchSize, options.status, options.community)).content);
      return { rows, total: first.totalElements };
    }));
    const rows = sources.flatMap(source => source.rows).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt) || b.id - a.id || a.targetType.localeCompare(b.targetType));
    const total = sources.reduce((sum, source) => sum + source.total, 0);
    return { ...paginate(rows, options.page, options.size), totalElements: total,
      totalPages: Math.ceil(total / options.size), last: (options.page + 1) * options.size >= total };
  },
  reportCounts: async () => {
    const totals = await Promise.all((['PENDING', 'RESOLVED'] as const).map(async status => {
      const pages = await Promise.all(reportTypes.map(type => reportPage(type, 0, 1, status)));
      return pages.reduce((sum, page) => sum + page.totalElements, 0);
    }));
    return { pending: totals[0], resolved: totals[1] };
  },
};
