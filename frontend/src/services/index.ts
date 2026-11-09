import apiClient from './apiClient';
import { assertImageRequestSize } from '../utils/imageUploadLimits';
import { Community, CommunityMember, Post, User, Report, CreateReportRequest, NotificationItem, Conversation, ChatMessage } from '../types';
import { demoConversations, demoNotifications } from '../mocks/demoContent';
interface AuthResponse {
  message?: string;
  data?: Partial<User>;
}

interface UserResponse {
  id?: string;
  username: string;
  email: string;
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
    showPostsOnProfile?: boolean;
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
  statistics: { postCount: number; commentCount: number; communityCount: number };
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
export const REPORTS_AVAILABLE = false;
export const REPORT_CREATION_AVAILABLE = true;
export const ADMIN_AVAILABLE = false;
export const USER_SEARCH_AVAILABLE = true;

function requireFeature(available: boolean, name: string): void {
  if (!available) throw new Error(`${name} hiện chưa khả dụng.`);
}
export const NOTIFICATIONS_AVAILABLE = false;
export const MESSAGES_AVAILABLE = false;

export const POSTS_UNAVAILABLE_MESSAGE = 'Tính năng bài viết hiện chưa khả dụng vì backend chưa có API.';
export const NOTIFICATIONS_UNAVAILABLE_MESSAGE = 'Tính năng thông báo hiện chưa khả dụng vì backend chưa có API.';

const postsUnavailableError = () => new Error(POSTS_UNAVAILABLE_MESSAGE);
const notificationsUnavailableError = () => new Error(NOTIFICATIONS_UNAVAILABLE_MESSAGE);
let localConversations = demoConversations.map((conversation) => ({
  ...conversation,
  participant: { ...conversation.participant },
  messages: conversation.messages.map((message) => ({ ...message })),
}));

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
  getMe: () => apiClient.get<UserResponse>('/user/me'),
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
      `/user/${encodeURIComponent(username)}`
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
        showPostsOnProfile: true,
      },
      role: response.role,
      status: 'ACTIVE',
      createdAt: response.joinedAt,
      karma: response.statistics.postCount,
    };
  },

  updateProfile: (data: Partial<User>) =>
    apiClient.patch<UserResponse>('/user/me/profile', {
      displayName: data.displayName,
      bio: data.bio,
      location: data.location,
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender ? API_GENDERS[data.gender] || data.gender : undefined,
      showDateOfBirth: data.privacy?.showDateOfBirth,
      showLocation: data.privacy?.showLocation,
      showPostsOnProfile: data.privacy?.showPostsOnProfile,
    }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.put<UserResponse>('/user/me/avatar', formData);
  },

  uploadBanner: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.put<UserResponse>('/user/me/banner', formData);
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
  joined?: boolean;
  ownerId?: string | number;
  ownerUsername?: string;
  owner?: { userId?: string | number; username?: string };
  createdAt: string;
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
    (await getAllCommunityPages('/explore')).map(mapCommunity),
  listByCategory: async (slug: string): Promise<Community[]> =>
    (await getAllCommunityPages(`/explore/${encodeURIComponent(slug)}`)).map(mapCommunity),
  search: async (query: string): Promise<Community[]> => {
    const escapedQuery = query.trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const filter = `name ~~ '%${escapedQuery}%' or info.description ~~ '%${escapedQuery}%'`;
    return (await getAllCommunityPages(`/explore/search?filter=${encodeURIComponent(filter)}`)).map(mapCommunity);
  },
  mine: async (): Promise<Community[]> => {
    const [owned, joined] = await Promise.all([
      getCommunitiesWithRole('/user/me/owned', 'OWNER'),
      getCommunitiesWithRole('/user/me/joined', 'MEMBER'),
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
    await apiClient.post(`/communities/${encodeURIComponent(name)}/members`);
    return true;
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
  list: async (): Promise<Report[]> => {
    requireFeature(REPORTS_AVAILABLE, 'Báo cáo');
    return apiClient.get<Report[]>('/reports');
  },
  listForCommunity: async (communityName: string): Promise<Report[]> => {
    requireFeature(REPORTS_AVAILABLE, 'Báo cáo');
    return apiClient.get<Report[]>(`/reports/community/${encodeURIComponent(communityName)}`);
  },
  resolve: async (reportId: string, status: 'RESOLVED' | 'REJECTED', resolutionNote?: string) => {
    requireFeature(REPORTS_AVAILABLE, 'Báo cáo');
    return apiClient.patch<Report>(`/reports/${reportId}`, { status, resolutionNote });
  },
};

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  activeCommunities: number;
  pendingReports: number;
  userGrowth: { month: string; users: number }[];
}

interface AdminUserApiResponse {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  role: User['role'];
  status: string;
  createdAt: string;
}

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    requireFeature(ADMIN_AVAILABLE, 'Quản trị');
    return apiClient.get<AdminStats>('/admin/stats');
  },
  listUsers: async (): Promise<User[]> => {
    requireFeature(ADMIN_AVAILABLE, 'Quản trị');
    const users = await apiClient.get<AdminUserApiResponse[]>('/admin/users');
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      bannerUrl: '',
      bio: '',
      privacy: { showDateOfBirth: false, showLocation: false, showPostsOnProfile: true },
      role: user.role,
      status: user.status === 'LOCKED' ? 'SUSPENDED' : user.status as User['status'],
      createdAt: user.createdAt,
      karma: 0,
    }));
  },
  updateUserStatus: async (id: string, status: string): Promise<User> => {
    requireFeature(ADMIN_AVAILABLE, 'Quản trị');
    const updated = await apiClient.patch<AdminUserApiResponse>(`/admin/users/${id}/status`, { status });
    return {
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      email: updated.email,
      avatarUrl: updated.avatarUrl || '',
      bannerUrl: '',
      bio: '',
      privacy: { showDateOfBirth: false, showLocation: false, showPostsOnProfile: true },
      role: updated.role,
      status: updated.status === 'LOCKED' ? 'SUSPENDED' : updated.status as User['status'],
      createdAt: updated.createdAt,
      karma: 0,
    };
  },
  listCommunities: async (): Promise<Community[]> => {
    requireFeature(ADMIN_AVAILABLE, 'Quản trị');
    const communities = await apiClient.get<CommunityApiResponse[]>('/admin/communities');
    return communities.map(mapCommunity);
  },
  setCommunityStatus: async (name: string, status: Community['status']) => {
    requireFeature(ADMIN_AVAILABLE, 'Quản trị');
    return apiClient.patch<void>(`/communities/${encodeURIComponent(name)}/status`, { status });
  },
};

export const notificationService = {
  list: async (): Promise<NotificationItem[]> =>
    NOTIFICATIONS_AVAILABLE
      ? apiClient.get<NotificationItem[]>('/notifications')
      : demoNotifications.map((notification) => ({ ...notification })),
  markRead: async (id: string): Promise<void> => {
    if (!NOTIFICATIONS_AVAILABLE) throw notificationsUnavailableError();
    return apiClient.put<void>(`/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    if (!NOTIFICATIONS_AVAILABLE) throw notificationsUnavailableError();
    return apiClient.put<void>('/notifications/read-all');
  },
  getPreferences: async (): Promise<NotificationPreferences> => {
    if (!NOTIFICATIONS_AVAILABLE) throw notificationsUnavailableError();
    return apiClient.get<NotificationPreferences>('/notifications/preferences');
  },
  savePreferences: async (preferences: NotificationPreferences): Promise<NotificationPreferences> => {
    if (!NOTIFICATIONS_AVAILABLE) throw notificationsUnavailableError();
    return apiClient.put<NotificationPreferences>('/notifications/preferences', preferences);
  },
};

export interface NotificationPreferences {
  inAppReplies: boolean;
  inAppMentions: boolean;
  inAppCommunityActivity: boolean;
  emailDigest: boolean;
  emailAnnouncements: boolean;
}

export const messageService = {
  list: async (): Promise<Conversation[]> => MESSAGES_AVAILABLE
    ? apiClient.get<Conversation[]>('/messages')
    : localConversations.map((conversation) => ({
        ...conversation,
        participant: { ...conversation.participant },
        messages: conversation.messages.map((message) => ({ ...message })),
      })),
  get: async (conversationId: string): Promise<Conversation> => {
    if (MESSAGES_AVAILABLE) return apiClient.get<Conversation>(`/messages/${conversationId}`);
    const conversation = localConversations.find((item) => item.id === conversationId);
    if (!conversation) throw new Error('Không tìm thấy cuộc trò chuyện.');
    return {
      ...conversation,
      participant: { ...conversation.participant },
      messages: conversation.messages.map((message) => ({ ...message })),
    };
  },
  createConversation: async (username: string): Promise<Conversation> => {
    if (MESSAGES_AVAILABLE) {
      return apiClient.post<Conversation>('/messages/conversations', { username });
    }
    const normalizedUsername = username.trim().replace(/^@/, '');
    if (!normalizedUsername) throw new Error('Vui lòng nhập tên người dùng.');
    const existing = localConversations.find(
      (conversation) => conversation.participant.username === normalizedUsername
    );
    if (existing) return existing;
    const conversation: Conversation = {
      id: `demo-conversation-${Date.now()}`,
      participant: {
        id: `demo-user-${normalizedUsername}`,
        username: normalizedUsername,
        displayName: normalizedUsername,
        avatarUrl: '',
        status: 'offline',
      },
      lastMessage: '',
      lastMessageTime: '',
      unreadCount: 0,
      messages: [],
    };
    localConversations = [conversation, ...localConversations];
    return conversation;
  },
  send: async (conversationId: string, text: string): Promise<ChatMessage> => {
    if (MESSAGES_AVAILABLE) {
      return apiClient.post<ChatMessage>(`/messages/${conversationId}`, { text });
    }
    const conversation = localConversations.find((item) => item.id === conversationId);
    const trimmedText = text.trim();
    if (!conversation) throw new Error('Không tìm thấy cuộc trò chuyện.');
    if (!trimmedText) throw new Error('Tin nhắn không được để trống.');
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const message: ChatMessage = {
      id: `demo-message-${Date.now()}`,
      senderId: 'demo-current-user',
      senderUsername: 'ban',
      text: trimmedText,
      timestamp,
      isMe: true,
    };
    localConversations = localConversations.map((item) =>
      item.id === conversationId
        ? { ...item, lastMessage: message.text, lastMessageTime: timestamp, messages: [...item.messages, message] }
        : item
    );
    return message;
  },
};
