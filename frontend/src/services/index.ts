import apiClient from './apiClient';
import { assertImageRequestSize } from '../utils/imageUploadLimits';
import { Community, CommunityMember, Post, User, Report, MyReport, CreateReportRequest, NotificationItem } from '../types';
interface AuthResponse {
  message?: string;
  data?: Partial<User>;
}

interface UserResponse {
  reputation?: User['reputation'];
  id?: string | number;
  username: string;
  email: string;
  provider?: User['provider'];
  role: User['role'];
  status: User['status'];
  createdAt: string;
  profile?: {
    displayName?: string | null;
    bio?: string | null;
    avatar?: string | null;
    banner?: string | null;
    location?: string | null;
    dateOfBirth?: string | null;
    gender?: string;
  };
  privacySettings?: {
    showDateOfBirth?: boolean;
    showLocation?: boolean;
  };
}

interface PublicUserProfileResponse {
  userId: string | number;
  username: string;
  joinedAt: string;
  profile: {
    displayName?: string | null;
    bio?: string | null;
    avatar?: string | null;
    banner?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    location?: string | null;
  } | null;
  reputation?: User['reputation'];
  role: User['role'];
}

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

const API_GENDERS: Record<string, string> = {
  Nam: 'MALE',
  Nữ: 'FEMALE',
  Khác: 'OTHER',
  'Không muốn tiết lộ': 'PREFER_NOT_TO_SAY',
};

export const POSTS_AVAILABLE = true;
export const POST_INTERACTIONS_AVAILABLE = true;
export const COMMENTS_AVAILABLE = true;
export const REPORT_CREATION_AVAILABLE = true;
export const ADMIN_AVAILABLE = true;
export const USER_SEARCH_AVAILABLE = true;

function requireFeature(available: boolean, name: string): void {
  if (!available) throw new Error(`${name} hiện chưa khả dụng.`);
}
export interface LoginSession {
  id: string;
  deviceName: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  current: boolean;
}
export const sessionService = {
  list: () => apiClient.get<LoginSession[]>('/auth/sessions'),
  revoke: (id: string) => apiClient.delete<{ message: string }>(`/auth/sessions/${encodeURIComponent(id)}`),
};

export const authService = {
  login: (emailOrUsername: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', {
      username: emailOrUsername.trim(),
      password,
    }),

  loginSocial: (provider: string, token: string) =>
    apiClient.post<AuthResponse>(`/auth/social/${provider}`, { token }),

  register: (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    displayName?: string;
  }) =>
    apiClient.post<AuthResponse>('/auth/register', {
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      confirmPassword: data.confirmPassword,
      displayName: data.displayName,
    }),

  verifyEmail: (data: { email: string; code: string }) =>
    apiClient.post<AuthResponse>('/auth/verify-email', {
      email: data.email.trim().toLowerCase(),
      code: data.code.trim(),
    }),

  resendOtp: (email: string) =>
    apiClient.post<{ message?: string }>('/auth/resend-otp', {
      email: email.trim().toLowerCase(),
    }),

  logout: () => apiClient.post<{ message?: string }>('/auth/logout'),

  forgotPassword: (email: string) =>
    apiClient.post<{ message?: string }>('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    }),

  verifyForgotPasswordOtp: (data: { email: string; code: string }) =>
    apiClient.post<{ message?: string }>('/auth/forgot-password/verify', {
      email: data.email.trim().toLowerCase(),
      code: data.code.trim(),
    }),

  resetPassword: (data: { password: string; confirmPassword: string }) =>
    apiClient.post<{ message?: string }>('/auth/forgot-password/reset', data),

  requestChangePasswordOtp: () => apiClient.post<{ message?: string }>('/auth/change-password/request'),

  verifyChangePasswordOtp: (code: string) =>
    apiClient.post<{ message?: string }>('/auth/change-password/verify', { code }),

  changePassword: (data: { password: string; confirmPassword: string }) =>
    apiClient.patch<{ message?: string }>('/auth/change-password', data),
};

export const userService = {
  getMe: () => apiClient.get<UserResponse>('/users/me'),
  search: async (query: string) => {
    requireFeature(USER_SEARCH_AVAILABLE, 'Tìm kiếm thành viên');
    const path = `/users/search?q=${encodeURIComponent(query.trim())}&size=100`;
    const first = await apiClient.get<{ content: UserSearchResult[]; totalPages: number }>(`${path}&page=0`);
    const rest = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
      apiClient.get<{ content: UserSearchResult[] }>(`${path}&page=${index + 1}`)));
    return [...first.content, ...rest.flatMap(page => page.content)];
  },
  getPublicProfile: async (username: string): Promise<User> => {
    const response = await apiClient.get<PublicUserProfileResponse>(
      `/users/by-username/${encodeURIComponent(username)}`
    );
    const profile = response.profile;
    return {
      id: String(response.userId),
      username: response.username,
      displayName: profile?.displayName || response.username,
      email: '',
      avatarUrl: profile?.avatar || '',
      bannerUrl: profile?.banner || '',
      bio: profile?.bio || '',
      location: profile?.location || undefined,
      dateOfBirth: profile?.dateOfBirth || undefined,
      gender: profile?.gender || undefined,
      privacy: {
        showDateOfBirth: Boolean(profile?.dateOfBirth),
        showLocation: Boolean(profile?.location),
      },
      role: response.role,
      status: 'ACTIVE',
      createdAt: response.joinedAt,
      karma: response.reputation?.score ?? 0,
      reputation: response.reputation,
    };
  },

  updateProfile: (data: Partial<User>) =>
    apiClient.patch<UserResponse>('/users/me/profile', {
      displayName: data.displayName,
      bio: data.bio,
      location: data.location,
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender ? API_GENDERS[data.gender] || data.gender : undefined,
      showDateOfBirth: data.privacy?.showDateOfBirth,
      showLocation: data.privacy?.showLocation,
    }),

  updatePrivacy: (privacy: Partial<Pick<User['privacy'], 'showDateOfBirth' | 'showLocation'>>) =>
    apiClient.patch<Pick<User['privacy'], 'showDateOfBirth' | 'showLocation'>>('/users/me/settings/privacy', {
      showDateOfBirth: privacy.showDateOfBirth,
      showLocation: privacy.showLocation,
    }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.put<UserResponse>('/users/me/avatar', formData);
  },

  uploadBanner: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.put<UserResponse>('/users/me/banner', formData);
  },
};

interface CommunityApiResponse {
  rules?: string | null;
  id: string | number;
  name: string;
  displayName?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  category?: string | { id?: number; name?: string; slug?: string } | null;
  categoryName?: string | null;
  visibility: Community['visibility'];
  status?: string;
  communityStatus?: string;
  categoryId?: number | null;
  memberCount: number;
  currentUserRole?: Community['currentUserRole'] | null;
  myRole?: Community['currentUserRole'] | null;
  joinRequestPending?: boolean;
  joined?: boolean;
  ownerId?: string | number;
  ownerUsername?: string;
  owner?: { userId?: string | number; username?: string };
  createdAt: string;
}

export interface CommunityJoinRequest {
  id: number;
  applicantUsername: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  requestedAt: string;
  reviewerUsername: string | null;
  reviewedAt: string | null;
}

interface CommunityPageResponse {
  content: CommunityApiResponse[];
  totalPages: number;
}

interface CommunityMemberApiResponse {
  userId: string | number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  role: CommunityMember['role'];
  joinedAt: string;
}

interface CommunityMemberPageResponse {
  content: CommunityMemberApiResponse[];
  totalPages: number;
}

function mapCommunity(value: CommunityApiResponse): Community {
  const categoryName = typeof value.category === 'string'
    ? value.category
    : value.category?.name;
  const displayName = value.displayName?.trim() || value.name;

  return {
    id: String(value.id),
    name: value.name,
    displayName,
    description: value.description || '',
    avatarUrl: value.avatarUrl || '',
    bannerUrl: value.bannerUrl || '',
    category: (value.categoryName || categoryName || 'Công nghệ') as Community['category'],
    visibility: value.visibility,
    status: mapCommunityStatus(value.status || value.communityStatus),
    memberCount: value.memberCount,
    currentUserRole: value.currentUserRole || value.myRole || (value.joined ? 'MEMBER' : 'NONE'),
    joinRequestPending: value.joinRequestPending,
    ownerId: String(value.ownerId || value.owner?.userId || ''),
    ownerUsername: value.ownerUsername || value.owner?.username || '',
    createdAt: value.createdAt,
    rules: typeof value.rules === 'string' ? value.rules : '',
  };
}

function mapCommunityStatus(status?: string): Community['status'] {
  if (status === 'BANED' || status === 'BANNED' || status === 'DISABLED') return 'BANNED';
  if (status === 'RESTRICTED') return 'RESTRICTED';
  return 'ACTIVE';
}

async function getAllCommunityPages(path: string): Promise<CommunityApiResponse[]> {
  const pageSize = 100;
  const pageUrl = (page: number) => `${path}${path.includes('?') ? '&' : '?'}page=${page}&size=${pageSize}`;
  const firstPage = await apiClient.get<CommunityPageResponse>(
    pageUrl(0)
  );
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
      apiClient.get<CommunityPageResponse>(pageUrl(index + 1))
    )
  );

  return [
    ...firstPage.content,
    ...remainingPages.flatMap((page) => page.content),
  ];
}

async function getAllCommunityMemberPages(
  name: string,
  role?: CommunityMember['role']
): Promise<CommunityMember[]> {
  const pageSize = 100;
  const roleQuery = role ? `&role=${encodeURIComponent(role)}` : '';
  const path = `/communities/${encodeURIComponent(name)}/members`;
  const firstPage = await apiClient.get<CommunityMemberPageResponse>(
    `${path}?page=0&size=${pageSize}${roleQuery}`
  );
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
      apiClient.get<CommunityMemberPageResponse>(
        `${path}?page=${index + 1}&size=${pageSize}${roleQuery}`
      )
    )
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.content).map((member) => ({
    id: String(member.userId),
    username: member.username,
    displayName: member.displayName || member.username,
    avatarUrl: member.avatarUrl || '',
    role: member.role,
    joinedAt: member.joinedAt,
    status: 'ACTIVE',
  }));
}

async function getCommunitiesWithRole(
  path: string,
  role: Community['currentUserRole']
): Promise<Community[]> {
  const communities = await getAllCommunityPages(path);
  return communities.map((community) => {
    const mapped = mapCommunity(community);
    // Joined results can include moderators. Keep the API role when provided;
    // the endpoint's role is only a fallback for responses without membership.
    return { ...mapped, currentUserRole: role === 'OWNER' || mapped.currentUserRole === 'NONE' ? role : mapped.currentUserRole };
  });
}

export const categoryService = {
  list: () => apiClient.get<Array<{ id: number; name: string; slug: string }>>('/categories'),
};

export const communityService = {
  list: async (): Promise<Community[]> =>
    (await getAllCommunityPages('/communities')).map(mapCommunity),
  listJoinRequests: (name: string, history: boolean, page: number) =>
    apiClient.get<{ content: CommunityJoinRequest[]; page: number; totalElements: number; totalPages: number }>(
      `/communities/${encodeURIComponent(name)}/join-requests?history=${history}&page=${page}`
    ),
  reviewJoinRequest: (name: string, id: number, approved: boolean) =>
    apiClient.patch<CommunityJoinRequest>(`/communities/${encodeURIComponent(name)}/join-requests/${id}`, { approved }),
  listByCategory: async (slug: string): Promise<Community[]> =>
    (await getAllCommunityPages(`/categories/${encodeURIComponent(slug)}/communities`)).map(mapCommunity),
  search: async (query: string): Promise<Community[]> => {
    const escapedQuery = query.trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const filter = `name ~~ '%${escapedQuery}%' or info.description ~~ '%${escapedQuery}%'`;
    return (await getAllCommunityPages(`/communities?filter=${encodeURIComponent(filter)}`)).map(mapCommunity);
  },
  mine: async (): Promise<Community[]> => {
    const [owned, joined] = await Promise.all([
      getCommunitiesWithRole('/users/me/communities/owned', 'OWNER'),
      getCommunitiesWithRole('/users/me/communities/joined', 'MEMBER'),
    ]);
    return [...owned, ...joined];
  },
  getByName: async (name: string): Promise<Community | undefined> => {
    const response = await apiClient.get<CommunityApiResponse>(`/communities/${encodeURIComponent(name)}`);
    return mapCommunity(response);
  },
  getDefaultRules: async (): Promise<string> => {
    const response = await apiClient.get<{ rules: string }>('/communities/default-rules');
    return response.rules;
  },
  create: async (data: {
    rules?: string;
    name: string;
    description: string;
    categoryId: number;
    visibility: Community['visibility'];
  }) => {
    const response = await apiClient.post<CommunityApiResponse>('/communities', {
      rules: data.rules,
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      visibility: data.visibility,
    });
    return { ...mapCommunity(response), currentUserRole: 'OWNER' as const };
  },
  update: async (name: string, data: Partial<Community>) => {
    let categoryId: number | undefined;
    if (data.category) {
      const categories = await categoryService.list();
      const category = categories.find((item) => item.name === data.category || item.slug === data.category);
      if (!category) throw new Error(`Không tìm thấy danh mục "${data.category}".`);
      categoryId = category.id;
    }
    const response = await apiClient.patch<CommunityApiResponse>(
      `/communities/${encodeURIComponent(name)}`,
      {
        rules: data.rules,
        description: data.description,
        categoryId,
        visibility: data.visibility,
      }
    );
    return mapCommunity(response);
  },
  uploadAvatar: async (name: string, file: File): Promise<Community> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.put<CommunityApiResponse>(
      `/communities/${encodeURIComponent(name)}/avatar`, formData
    );
    return mapCommunity(response);
  },
  uploadBanner: async (name: string, file: File): Promise<Community> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.put<CommunityApiResponse>(
      `/communities/${encodeURIComponent(name)}/banner`, formData
    );
    return mapCommunity(response);
  },
  members: async (name: string, role?: CommunityMember['role']): Promise<CommunityMember[]> =>
    getAllCommunityMemberPages(name, role),
  appointModerator: async (name: string, username: string) =>
    apiClient.put(`/communities/${encodeURIComponent(name)}/moderators/${encodeURIComponent(username)}`),
  removeModerator: async (name: string, username: string) =>
    apiClient.delete(`/communities/${encodeURIComponent(name)}/moderators/${encodeURIComponent(username)}`),
  kickMember: async (name: string, username: string) =>
    apiClient.delete(`/communities/${encodeURIComponent(name)}/members/${encodeURIComponent(username)}`),
  transferOwnership: async (name: string, username: string) =>
    apiClient.put(`/communities/${encodeURIComponent(name)}/owner`, { username }),
  join: async (name: string) => {
    return apiClient.post<{ message: string; currentUserRole: Community['currentUserRole'] | null; joinRequestPending: boolean }>(
      `/communities/${encodeURIComponent(name)}/members`
    );
  },
  leave: async (name: string) => {
    await apiClient.delete(`/communities/${encodeURIComponent(name)}/members/me`);
    return true;
  },
};

export interface PostPage {
  content: Post[]; page: number; size: number; totalElements: number;
  totalPages: number; first: boolean; last: boolean; empty: boolean;
}
export interface TrashedPost { post: Post; deletedAt: string | null; canRestore: boolean; }
export interface TrashPage extends Omit<PostPage, 'content'> { content: TrashedPost[]; }
function postFormData(input: import('../types').PostInput): FormData {
  const { files = [], ...post } = input;
  assertImageRequestSize(files, post);
  const form = new FormData();
  form.append('post', new Blob([JSON.stringify(post)], { type: 'application/json' }));
  files.forEach(file => form.append('files', file));
  return form;
}

export const postService = {
  saved: (page = 0) => apiClient.get<PostPage>(`/posts/saved?page=${page}&size=20`),
  save: (id: string, saved: boolean) => saved
    ? apiClient.put<Post>(`/posts/${id}/save`)
    : apiClient.delete<Post>(`/posts/${id}/save`),
  trash: (page = 0) => apiClient.get<TrashPage>(`/posts/trash?page=${page}&size=20`),
  restore: (id: string) => apiClient.post<Post>(`/posts/${id}/restore`),
  vote: (id: string, type: 'UP' | 'DOWN' | null) => type === null
    ? apiClient.delete<Post>(`/posts/${id}/vote`)
    : apiClient.put<Post>(`/posts/${id}/vote`, { type }),
  setPinned: (id: string, pinned: boolean) => pinned
    ? apiClient.put<void>(`/posts/${id}/pin`)
    : apiClient.delete<void>(`/posts/${id}/pin`),
  list: (tab = 'for-you', page = 0) => apiClient.get<PostPage>(`/posts?tab=${encodeURIComponent(tab)}&page=${page}&size=20`),
  getById: (id: string) => apiClient.get<Post>(`/posts/${id}`),
  search: (query: string, page = 0) => apiClient.get<PostPage>(`/posts?tab=latest&q=${encodeURIComponent(query.trim())}&page=${page}&size=20`),
  create: (input: import('../types').PostInput) => apiClient.post<Post>('/posts', postFormData(input)),
  update: (id: string, input: import('../types').PostInput) => apiClient.patch<Post>(`/posts/${id}`, postFormData(input)),
  delete: (id: string) => apiClient.delete<void>(`/posts/${id}`),
  listCommunity: (name: string, page = 0) => apiClient.get<PostPage>(`/communities/${encodeURIComponent(name)}/posts?page=${page}&size=20`),
  listUser: (name: string, page = 0) => apiClient.get<PostPage>(`/users/${encodeURIComponent(name)}/posts?page=${page}&size=20`),
};

export interface CommentMutationResponse {
  voteScore: number;
  userVote: 'UP' | 'DOWN' | null;
  attachments: { id: number; fileName: string; contentType: string; size: number; url: string; expiresAt?: string }[];
  id: number;
  postId: number;
  authorId: number;
  parentId: number | null;
  content: string;
  status: 'VISIBLE' | 'HIDDEN' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  author: { id: number; username: string; displayName: string | null; avatarUrl: string | null; isAuthor: boolean };
}

export const commentService = {
  list: (postId: string) => apiClient.get<CommentMutationResponse[]>(`/posts/${postId}/comments`),
  create: (postId: string, content: string, parentCommentId?: string, files: File[] = []) => {
    assertImageRequestSize(files, { postId, content, parentId: parentCommentId ?? null });
    if (!files.length) return apiClient.post<CommentMutationResponse>('/comments', {
      postId, content, parentId: parentCommentId ?? null,
    });
    const body = new FormData();
    body.append('comment', new Blob([JSON.stringify({ postId, content, parentId: parentCommentId ?? null })], { type: 'application/json' }));
    files.forEach(file => body.append('files', file));
    return apiClient.post<CommentMutationResponse>('/comments', body);
  },
  update: (commentId: string, content: string) =>
    apiClient.patch<CommentMutationResponse>(`/comments/${commentId}`, { content }),
  delete: (commentId: string) => apiClient.delete<{ message: string }>(`/comments/${commentId}`),
  vote: (commentId: string, type: 'UP' | 'DOWN' | null) => type === null
    ? apiClient.delete<CommentMutationResponse>(`/comments/${commentId}/vote`)
    : apiClient.put<CommentMutationResponse>(`/comments/${commentId}/vote`, { type }),
};

export const reportService = {
  listMine: (type: MyReport['targetType'], status: MyReport['status'] | '', page: number) => {
    const params = new URLSearchParams({ type, page: String(page), size: '10' });
    if (status) params.set('status', status);
    return apiClient.get<{ content: MyReport[]; last: boolean; totalPages: number }>(`/reports/me?${params}`);
  },
  create: async (data: CreateReportRequest): Promise<Report> => {
    requireFeature(REPORT_CREATION_AVAILABLE, 'Báo cáo');
    if (!Number.isSafeInteger(data.targetId) || data.targetId <= 0) throw new Error('Nội dung báo cáo không hợp lệ.');
    const response = await apiClient.post<{
      id: number; targetType: CreateReportRequest['targetType']; targetId: number;
      communityName: string; reporterUsername: string; reason: string; description: string | null;
      status: Report['status']; resolutionNote: string | null; createdAt: string;
    }>('/reports', data);
    return {
      id: String(response.id), contentType: response.targetType, contentId: String(response.targetId),
      communityName: response.communityName, reporterUsername: response.reporterUsername,
      reason: response.reason, description: response.description ?? undefined, status: response.status,
      resolutionNote: response.resolutionNote ?? undefined, createdAt: response.createdAt,
    };
  },
};

export interface AdminStats {
  users: { total: number; active: number; suspended: number };
  communities: { total: number; active: number; suspended: number };
  posts: { total: number };
  comments: { total: number };
}

export interface AdminUserApiResponse {
  id: string | number;
  username: string;
  displayName: string | null;
  email: string;
  avatarUrl?: string | null;
  role: User['role'];
  status: string;
  createdAt: string;
}

export interface AdminUserPage {
  content: AdminUserApiResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface AdminUserDetail {
  userId: number | string;
  username: string;
  joinedAt: string;
  profile: {
    displayName: string | null;
    bio: string | null;
    avatar: string | null;
    banner: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    location: string | null;
  };
}

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    requireFeature(ADMIN_AVAILABLE, 'Quản trị');
    const response = await apiClient.get<{ data: AdminStats }>('/admin/stats');
    return response.data;
  },
  listUsers: async (options: { page?: number; size?: number; status?: string; role?: string; sort?: string } = {}): Promise<AdminUserPage> => {
    requireFeature(ADMIN_AVAILABLE, 'Quản trị');
    const params = new URLSearchParams({
      page: String(options.page ?? 0), size: String(options.size ?? 10),
      sort: options.sort ?? 'createdAt,desc',
    });
    if (options.status) params.set('status', options.status);
    if (options.role) params.set('role', options.role);
    return apiClient.get<AdminUserPage>(`/admin/users?${params}`);
  },
  searchUsers: async (options: { search: string; page?: number; size?: number; status?: string; role?: string }): Promise<AdminUserPage> => {
    requireFeature(ADMIN_AVAILABLE, 'Quản trị');
    const search = options.search.trim();
    if (!search) throw new Error('Từ khóa tìm kiếm không được để trống.');
    const params = new URLSearchParams({
      search,
      page: String(options.page ?? 0),
      size: String(options.size ?? 10),
    });
    if (options.status) params.set('status', options.status);
    if (options.role) params.set('role', options.role);
    return apiClient.get<AdminUserPage>(`/admin/users/search?${params}`);
  },
  getUserDetail: (id: string | number): Promise<AdminUserDetail> => {
    requireFeature(ADMIN_AVAILABLE, 'Quản trị');
    return apiClient.get<AdminUserDetail>(`/admin/users/${encodeURIComponent(String(id))}`);
  },
  lockUser: (id: string | number): Promise<{ message: string }> =>
    apiClient.patch<{ message: string }>(`/admin/users/${id}/lock`),
  unlockUser: (id: string | number): Promise<{ message: string }> =>
    apiClient.patch<{ message: string }>(`/admin/users/${id}/unlock`),
};

type NotificationResponse = {
  id: number;
  type: NotificationItem['type'];
  actor: NotificationItem['actor'];
  postId: number | null;
  commentId: number | null;
  communityName: string | null;
  reportId: number | null;
  reportTargetType: CreateReportRequest['targetType'] | null;
  reportStatus: 'RESOLVED' | 'REJECTED' | null;
  read: boolean;
  createdAt: string;
};

function mapNotification(item: NotificationResponse): NotificationItem {
  let targetUrl = item.postId ? `/post/${item.postId}${item.commentId ? `#comment-${item.commentId}` : ''}` : '/notifications';
  const communityLabel = item.communityName ? `c/${item.communityName}` : 'cộng đồng';
  const messages = {
    COMMUNITY_JOIN_CONFIRMED: `Bạn đã tham gia ${communityLabel}.`,
    COMMUNITY_MEMBER_JOINED: `đã tham gia ${communityLabel}.`,
    COMMUNITY_JOIN_REQUEST_SENT: `Bạn đã gửi yêu cầu tham gia ${communityLabel}. Yêu cầu đang chờ duyệt.`,
    COMMUNITY_JOIN_REQUEST_RECEIVED: `đã gửi yêu cầu tham gia ${communityLabel}.`,
    COMMUNITY_JOIN_APPROVED: `Yêu cầu tham gia ${communityLabel} của bạn đã được duyệt.`,
    COMMUNITY_JOIN_REJECTED: `Yêu cầu tham gia ${communityLabel} của bạn đã bị từ chối.`,
    COMMUNITY_POST_CREATED: item.communityName ? `đã đăng bài mới trong c/${item.communityName}.` : 'đã đăng bài mới trong cộng đồng.',
    POST_COMMENTED: 'đã bình luận về bài viết của bạn.',
    COMMENT_REPLIED: 'đã trả lời bình luận của bạn.',
    REPORT_SUBMITTED: 'Có báo cáo mới cần xem xét.',
    REPORT_REVIEWED: item.reportStatus === 'RESOLVED' ? 'Báo cáo của bạn đã được giải quyết.' : 'Báo cáo của bạn đã bị bác bỏ.',
    REPORT_WARNING: item.reportTargetType === 'COMMUNITY'
      ? `Cảnh cáo từ quản trị viên hệ thống: cộng đồng ${item.communityName ? `c/${item.communityName}` : 'của bạn'} được xác định có vi phạm.`
      : 'Cảnh cáo từ quản trị viên hệ thống: bài viết của bạn được xác định có vi phạm.',
  };
  if (item.type === 'REPORT_SUBMITTED') {
    targetUrl = item.reportTargetType === 'MESSAGE'
      ? `/admin/reports/MESSAGE/${item.reportId}`
      : item.reportTargetType === 'COMMUNITY'
      ? `/admin/reports?type=COMMUNITY${item.reportId ? `&reportId=${item.reportId}` : ''}`
      : item.communityName ? `/c/${encodeURIComponent(item.communityName)}/moderation?type=${item.reportTargetType || 'POST'}` : '/notifications';
  }
  if (item.type === 'REPORT_WARNING' && item.reportTargetType === 'COMMUNITY' && item.communityName) {
    targetUrl = `/c/${encodeURIComponent(item.communityName)}`;
  }
  if (item.type === 'REPORT_REVIEWED' && item.reportTargetType === 'MESSAGE') targetUrl = '/reports/mine?type=MESSAGE';
  const isMembershipNotification = item.type.startsWith('COMMUNITY_JOIN_') || item.type === 'COMMUNITY_MEMBER_JOINED';
  if (isMembershipNotification && item.communityName) {
    const communityPath = `/c/${encodeURIComponent(item.communityName)}`;
    targetUrl = item.type === 'COMMUNITY_JOIN_REQUEST_RECEIVED'
      ? `${communityPath}/moderation?tab=join-requests`
      : communityPath;
  }
  const showActor = !item.type.startsWith('REPORT_') && (!isMembershipNotification
    || item.type === 'COMMUNITY_MEMBER_JOINED' || item.type === 'COMMUNITY_JOIN_REQUEST_RECEIVED');
  return {
    id: String(item.id), type: item.type,
    actor: showActor ? item.actor : null,
    message: messages[item.type], targetUrl, isRead: item.read, createdAt: item.createdAt,
  };
}

export const notificationService = {
  getNotifications: async (page = 0, unreadOnly = false) => {
    const response = await apiClient.get<{ content: NotificationResponse[]; last: boolean; totalElements: number }>(
      `/notifications?page=${page}&size=20&unreadOnly=${unreadOnly}`);
    return { ...response, content: response.content.map(mapNotification) };
  },
  getUnreadNotificationCount: () => apiClient.get<{ unreadCount: number; totalCount: number; latestId: number | null; lastReadAt: string | null }>('/notifications/unread-count'),
  markNotificationAsRead: (id: string) => apiClient.put<void>(`/notifications/${encodeURIComponent(id)}/read`),
  markAllNotificationsAsRead: () => apiClient.put<void>('/notifications/read-all'),
  deleteReadNotifications: () => apiClient.delete<void>('/notifications/read'),
  getCommunityNotificationPreference: (name: string) => apiClient.get<{ newPostEnabled: boolean }>(
    `/communities/${encodeURIComponent(name)}/notification-preferences`),
  updateCommunityNotificationPreference: (name: string, newPostEnabled: boolean) => apiClient.put<{ newPostEnabled: boolean }>(
    `/communities/${encodeURIComponent(name)}/notification-preferences`, { newPostEnabled }),
};
