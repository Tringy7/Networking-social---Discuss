import apiClient from './apiClient';
import { Community, CommunityMember, Post, Comment, User, Report, NotificationItem, Conversation, ChatMessage } from '../types';
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
  showPostsOnProfile: boolean;
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
  }) =>
    apiClient.post<AuthResponse>('/auth/register', {
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      confirmPassword: data.confirmPassword,
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
  getMe: () => apiClient.get<UserResponse>('/users/me'),
  search: (query: string) =>
    apiClient.get<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`),
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
        showPostsOnProfile: response.showPostsOnProfile,
      },
      role: response.role,
      status: 'ACTIVE',
      createdAt: response.joinedAt,
      karma: response.statistics.postCount,
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
      showPostsOnProfile: data.privacy?.showPostsOnProfile,
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
  id: string | number;
  name: string;
  displayName?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  category?: string | null;
  categoryName?: string | null;
  visibility: Community['visibility'];
  status?: Community['status'];
  memberCount: number;
  currentUserRole?: Community['currentUserRole'] | null;
  myRole?: Community['currentUserRole'] | null;
  joined?: boolean;
  ownerId?: string | number;
  ownerUsername?: string;
  createdAt: string;
}

function mapCommunity(value: CommunityApiResponse): Community {
  return {
    id: String(value.id),
    name: value.name,
    displayName: value.displayName || value.name,
    description: value.description || '',
    avatarUrl: value.avatarUrl || '',
    bannerUrl: value.bannerUrl || '',
    category: value.category || value.categoryName || 'Công nghệ',
    visibility: value.visibility,
    status: value.status === 'DISABLED' ? 'BANNED' : value.status || 'ACTIVE',
    memberCount: value.memberCount,
    currentUserRole: value.currentUserRole || value.myRole || (value.joined ? 'MEMBER' : 'NONE'),
    ownerId: String(value.ownerId || ''),
    ownerUsername: value.ownerUsername || '',
    createdAt: value.createdAt,
    rules: [],
  };
}

export const categoryService = {
  list: () => apiClient.get<Array<{ id: number; name: string; slug: string }>>('/categories'),
};

export const communityService = {
  list: async (): Promise<Community[]> =>
    (await apiClient.get<CommunityApiResponse[]>('/communities')).map(mapCommunity),
  mine: async (): Promise<Community[]> =>
    (await apiClient.get<CommunityApiResponse[]>('/communities/mine')).map(mapCommunity),
  getByName: async (name: string): Promise<Community | undefined> => {
    const response = await apiClient.get<CommunityApiResponse>(`/communities/${encodeURIComponent(name)}`);
    return mapCommunity(response);
  },
  create: async (data: Omit<Community, 'id' | 'status' | 'memberCount' | 'currentUserRole' | 'ownerId' | 'ownerUsername' | 'createdAt' | 'rules'>) => {
    const categories = await categoryService.list();
    const category = categories.find((item) => item.name === data.category);
    if (!category) {
      throw new Error(`Không tìm thấy danh mục "${data.category}".`);
    }
    const response = await apiClient.post<CommunityApiResponse>('/communities', {
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      categoryId: category.id,
      visibility: data.visibility,
    });
    return mapCommunity(response);
  },
  update: async (name: string, data: Partial<Community>) => {
    let categoryId: number | undefined;
    if (data.category) {
      const categories = await categoryService.list();
      const category = categories.find((item) => item.name === data.category);
      if (!category) throw new Error(`Không tìm thấy danh mục "${data.category}".`);
      categoryId = category.id;
    }
    const response = await apiClient.put<CommunityApiResponse>(
      `/communities/${encodeURIComponent(name)}`,
      {
        displayName: data.displayName,
        description: data.description,
        categoryId,
        visibility: data.visibility,
      }
    );
    return mapCommunity(response);
  },
  members: async (name: string): Promise<CommunityMember[]> =>
    apiClient.get<CommunityMember[]>(`/communities/${encodeURIComponent(name)}/members`),
  setStatus: async (name: string, status: Community['status']) =>
    apiClient.patch(`/communities/${encodeURIComponent(name)}/status`, { status }),
  updateMemberRole: async (name: string, memberId: string, role: CommunityMember['role']) =>
    apiClient.patch(`/communities/${encodeURIComponent(name)}/members/${memberId}/role`, { role }),
  setMemberStatus: async (name: string, memberId: string, status: CommunityMember['status']) =>
    apiClient.patch(`/communities/${encodeURIComponent(name)}/members/${memberId}/status`, { status }),
  join: async (name: string) => {
    await apiClient.post(`/communities/${encodeURIComponent(name)}/join`);
    return true;
  },
  leave: async (name: string) => {
    await apiClient.post(`/communities/${encodeURIComponent(name)}/leave`);
    return true;
  },
};

export const postService = {
  list: async (tab: string = 'for-you'): Promise<Post[]> => {
    return apiClient.get<Post[]>(`/posts?tab=${encodeURIComponent(tab)}`);
  },
  getById: async (postId: string): Promise<Post | undefined> => {
    return apiClient.get<Post>(`/posts/${postId}`);
  },
  create: async (data: {
    communityName: string;
    title: string;
    content: string;
    tags?: string[];
    mediaUrl?: string;
    mediaType?: Post['mediaType'];
    codeSnippet?: Post['codeSnippet'];
  }) => {
    return apiClient.post<Post>('/posts', data);
  },
  toggleHeart: async (postId: string, isHearted: boolean) => {
    return apiClient.put<{ isHearted: boolean }>(`/posts/${postId}/vote`, {
      voteType: isHearted ? 0 : 1,
    });
  },
  toggleSave: async (postId: string) =>
    apiClient.put<{ isSaved: boolean }>(`/posts/${postId}/save`),
  delete: async (postId: string) => apiClient.delete<void>(`/posts/${postId}`),
  listSaved: async (): Promise<Post[]> => apiClient.get<Post[]>('/posts/saved'),
};

export const commentService = {
  list: async (postId: string): Promise<Comment[]> => {
    return apiClient.get<Comment[]>(`/posts/${postId}/comments`);
  },
  create: async (postId: string, content: string, parentCommentId?: string): Promise<Comment> => {
    return apiClient.post<Comment>(`/posts/${postId}/comments`, { content, parentCommentId });
  },
  toggleHeart: async (postId: string, commentId: string) =>
    apiClient.put<{ isHearted: boolean }>(`/posts/${postId}/comments/${commentId}/vote`),
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
  list: async (): Promise<NotificationItem[]> => apiClient.get<NotificationItem[]>('/notifications'),
  markRead: async (id: string) => apiClient.put<void>(`/notifications/${id}/read`),
  markAllRead: async () => apiClient.put<void>('/notifications/read-all'),
  getPreferences: async (): Promise<NotificationPreferences> =>
    apiClient.get<NotificationPreferences>('/notifications/preferences'),
  savePreferences: async (preferences: NotificationPreferences): Promise<NotificationPreferences> =>
    apiClient.put<NotificationPreferences>('/notifications/preferences', preferences),
};

export interface NotificationPreferences {
  inAppReplies: boolean;
  inAppMentions: boolean;
  inAppCommunityActivity: boolean;
  emailDigest: boolean;
  emailAnnouncements: boolean;
}

export const messageService = {
  list: async (): Promise<Conversation[]> => apiClient.get<Conversation[]>('/messages'),
  get: async (conversationId: string): Promise<Conversation> =>
    apiClient.get<Conversation>(`/messages/${conversationId}`),
  createConversation: async (username: string): Promise<Conversation> =>
    apiClient.post<Conversation>('/messages/conversations', { username }),
  send: async (conversationId: string, text: string): Promise<ChatMessage> =>
    apiClient.post<ChatMessage>(`/messages/${conversationId}`, { text }),
};
