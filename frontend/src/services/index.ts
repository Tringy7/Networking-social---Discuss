import apiClient from './apiClient';
import { Community, CommunityMember, Post, Comment, User, Report, NotificationItem, Conversation, ChatMessage } from '../types';
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

export const POSTS_AVAILABLE = false;
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

  changePassword: (data: { oldPassword: string; password: string; confirmPassword: string }) =>
    apiClient.patch<{ message?: string }>('/auth/change-password', data),
};

export const userService = {
  getMe: () => apiClient.get<UserResponse>('/user/me'),
  search: (query: string) =>
    apiClient.get<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`),
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
  const displayName = value.displayName || value.name
    .split('-')
    .map((part) => part ? `${part[0].toLocaleUpperCase('vi-VN')}${part.slice(1)}` : part)
    .join(' ');

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
    rules: [],
  };
}

function mapCommunityStatus(status?: string): Community['status'] {
  if (status === 'BANED' || status === 'BANNED' || status === 'DISABLED') return 'BANNED';
  if (status === 'RESTRICTED') return 'RESTRICTED';
  return 'ACTIVE';
}

async function getAllCommunityPages(path: string): Promise<CommunityApiResponse[]> {
  const pageSize = 100;
  const firstPage = await apiClient.get<CommunityPageResponse>(
    `${path}?page=0&size=${pageSize}`
  );
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
      apiClient.get<CommunityPageResponse>(`${path}?page=${index + 1}&size=${pageSize}`)
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
  return communities.map((community) => ({
    ...mapCommunity(community),
    currentUserRole: role,
  }));
}

export const categoryService = {
  list: () => apiClient.get<Array<{ id: number; name: string; slug: string }>>('/categories'),
};

export const communityService = {
  list: async (): Promise<Community[]> =>
    (await getAllCommunityPages('/explore')).map(mapCommunity),
  listByCategory: async (slug: string): Promise<Community[]> =>
    (await getAllCommunityPages(`/explore/${encodeURIComponent(slug)}`)).map(mapCommunity),
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
  create: async (data: {
    name: string;
    description: string;
    categoryId: number;
    visibility: Community['visibility'];
  }) => {
    const response = await apiClient.post<CommunityApiResponse>('/communities', {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      visibility: data.visibility,
    });
    return { ...mapCommunity(response), currentUserRole: 'OWNER' };
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
    apiClient.put(`/communities/communities/${encodeURIComponent(name)}/owner`, { username }),
  join: async (name: string) => {
    await apiClient.post(`/communities/${encodeURIComponent(name)}/members`);
    return true;
  },
  leave: async (name: string) => {
    await apiClient.delete(`/communities/${encodeURIComponent(name)}/members/me`);
    return true;
  },
};

export const postService = {
  list: async (tab: string = 'for-you'): Promise<Post[]> =>
    POSTS_AVAILABLE
      ? apiClient.get<Post[]>(`/posts?tab=${encodeURIComponent(tab)}`)
      : [],
  getById: async (postId: string): Promise<Post | undefined> =>
    POSTS_AVAILABLE ? apiClient.get<Post>(`/posts/${postId}`) : undefined,
  create: async (data: {
    communityName: string;
    title: string;
    content: string;
    tags?: string[];
    mediaUrl?: string;
    mediaType?: Post['mediaType'];
    codeSnippet?: Post['codeSnippet'];
  }): Promise<Post> => {
    if (!POSTS_AVAILABLE) throw postsUnavailableError();
    return apiClient.post<Post>('/posts', data);
  },
  toggleHeart: async (postId: string, isHearted: boolean): Promise<{ isHearted: boolean }> => {
    if (!POSTS_AVAILABLE) throw postsUnavailableError();
    return apiClient.put<{ isHearted: boolean }>(`/posts/${postId}/vote`, {
      voteType: isHearted ? 0 : 1,
    });
  },
  toggleSave: async (postId: string): Promise<{ isSaved: boolean }> => {
    if (!POSTS_AVAILABLE) throw postsUnavailableError();
    return apiClient.put<{ isSaved: boolean }>(`/posts/${postId}/save`);
  },
  delete: async (postId: string): Promise<void> => {
    if (!POSTS_AVAILABLE) throw postsUnavailableError();
    return apiClient.delete<void>(`/posts/${postId}`);
  },
  listSaved: async (): Promise<Post[]> =>
    POSTS_AVAILABLE ? apiClient.get<Post[]>('/posts/saved') : [],
};

export const commentService = {
  list: async (postId: string): Promise<Comment[]> =>
    POSTS_AVAILABLE ? apiClient.get<Comment[]>(`/posts/${postId}/comments`) : [],
  create: async (
    postId: string,
    content: string,
    parentCommentId?: string
  ): Promise<Comment> => {
    if (!POSTS_AVAILABLE) throw postsUnavailableError();
    return apiClient.post<Comment>(`/posts/${postId}/comments`, { content, parentCommentId });
  },
  toggleHeart: async (postId: string, commentId: string): Promise<{ isHearted: boolean }> => {
    if (!POSTS_AVAILABLE) throw postsUnavailableError();
    return apiClient.put<{ isHearted: boolean }>(`/posts/${postId}/comments/${commentId}/vote`);
  },
};

export const reportService = {
  create: async (data: Omit<Report, 'id' | 'status' | 'createdAt' | 'reporterUsername'>) => {
    return apiClient.post<Report>('/reports', data);
  },
  list: async (): Promise<Report[]> => apiClient.get<Report[]>('/reports'),
  listForCommunity: async (communityName: string): Promise<Report[]> =>
    apiClient.get<Report[]>(`/reports/community/${encodeURIComponent(communityName)}`),
  resolve: async (reportId: string, status: 'RESOLVED' | 'REJECTED', resolutionNote?: string) =>
    apiClient.patch<Report>(`/reports/${reportId}`, { status, resolutionNote }),
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
  getStats: async (): Promise<AdminStats> => apiClient.get<AdminStats>('/admin/stats'),
  listUsers: async (): Promise<User[]> => {
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
    const communities = await apiClient.get<CommunityApiResponse[]>('/admin/communities');
    return communities.map(mapCommunity);
  },
  setCommunityStatus: async (name: string, status: Community['status']) =>
    apiClient.patch<void>(`/communities/${encodeURIComponent(name)}/status`, { status }),
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
